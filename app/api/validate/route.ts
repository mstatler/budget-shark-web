// app/api/validate/route.ts
import { createClient } from "@supabase/supabase-js";
import { ok, fail } from "../_utils/response";
import { logPipelineRun } from "../_utils/telemetry";
import * as XLSX from "xlsx";

/**
 * Phase 3.2 — Validation Pipeline
 * Phase 3.4.2 — UX buckets
 * Phase 3.4.3 — XLSX/CSV dual support
 * Phase 3.4.4 — Telemetry
 */

type HeaderCheckResult = {
  status: "pass" | "fail";
  normalizedHeaders: string[];
  requiredMissing: string[];
  eitherMissing: string[];
  duplicates: string[];
  unexpected: string[];
};

type RowIssue = {
  row: number;
  field: string;
  value?: string | null;
  message: string;
};

type RowScanResult = {
  status: "pass" | "fail" | "skipped";
  checked: number;
  invalidCount: number;
  invalid: RowIssue[];
  rowCapExceeded: boolean;
  warnCount: number;
  warnings: RowIssue[];
  referentials: {
    used: boolean;
    deptCount: number;
    entityCount: number;
    accountCount: number;
    skippedReason?: string;
  };
};

type ValidationBucketItem = {
  code: string;
  message: string;
  row?: number;
  field?: string;
  value?: string | null;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const STORAGE_BUCKET = process.env.UPLOADS_BUCKET || "uploads";

// ---- Config ----
const MAX_ROWS = 50_000;
const MAX_ISSUES_RETURNED = 200;
const MAX_BUCKET_ITEMS = 200;

// ---------- Utils ----------

function getCookieOrgIdFromRequest(req: Request): string | null {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const parts = cookieHeader.split(";");
    for (const part of parts) {
      const s = part.trim();
      if (s.startsWith("bs_org_id=")) {
        return decodeURIComponent(s.slice("bs_org_id=".length));
      }
    }
    return null;
  } catch {
    return null;
  }
}


function getUploadIdFromRequest(req: Request): string | null {
  try {
    const url = new URL(req.url);
    return url.searchParams.get("uploadId");
  } catch {
    return null;
  }
}

async function readJsonBody<T = unknown>(req: Request): Promise<T | null> {
  try {
    if ((req.headers.get("content-type") || "").includes("application/json")) {
      return (await req.json()) as T;
    }
  } catch {}
  return null;
}

function normalizeHeaderToken(h: string): string {
  return h.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function splitLines(csvText: string): string[] {
  return csvText.split(/\r?\n/);
}

function splitFirstNonEmptyLineAsHeaders(csvText: string): string[] {
  const lines = splitLines(csvText);
  const first = lines.find((l) => l.trim().length > 0) ?? "";
  return first.split(",").map(normalizeHeaderToken);
}

function headerCheck(headers: string[]): HeaderCheckResult {
  const required = ["org_id", "scenario", "month", "account_code", "amount"];
  const either = ["dept_id", "entity_id"];
  const allowed = new Set([...required, ...either]);

  const normalized = headers.map(normalizeHeaderToken);

  const counts = new Map<string, number>();
  for (const h of normalized) counts.set(h, (counts.get(h) || 0) + 1);
  const duplicates = [...counts.entries()].filter(([, n]) => n > 1).map(([h]) => h);

  const requiredMissing = required.filter((r) => !normalized.includes(r));
  const eitherMissing = either.every((x) => !normalized.includes(x)) ? [...either] : [];
  const unexpected = normalized.filter((h) => !allowed.has(h));

  const hasFailures =
    duplicates.length > 0 ||
    requiredMissing.length > 0 ||
    eitherMissing.length > 0 ||
    unexpected.length > 0;

  return {
    status: hasFailures ? "fail" : "pass",
    normalizedHeaders: normalized,
    requiredMissing,
    eitherMissing,
    duplicates,
    unexpected,
  };
}

function supabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Supabase env not configured");
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

async function downloadText(bucket: string, path: string) {
  const sb = supabase();
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  const buf = await data.arrayBuffer();
  return { text: new TextDecoder("utf-8").decode(buf), byteLength: buf.byteLength };
}

async function downloadBinary(bucket: string, path: string) {
  const sb = supabase();
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  const buf = await data.arrayBuffer();
  return { arrayBuffer: buf, byteLength: buf.byteLength };
}

async function fileExists(bucket: string, path: string): Promise<boolean> {
  try {
    const sb = supabase();
    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) return false;
    await data.arrayBuffer();
    return true;
  } catch {
    return false;
  }
}

async function tryLoadJsonArray(bucket: string, path: string): Promise<string[] | null> {
  try {
    const sb = supabase();
    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) return null;
    const txt = await data.text();
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? (arr as string[]) : null;
  } catch {
    return null;
  }
}

// ---- referentials ----
type RefSets = {
  used: boolean;
  dept: Set<string>;
  entity: Set<string>;
  account: Set<string>;
  deptCount: number;
  entityCount: number;
  accountCount: number;
  skippedReason?: string;
};

async function loadReferenceSets(orgId: string): Promise<RefSets> {
  const base = `org/${orgId}/reference`;
  const dept = await tryLoadJsonArray(STORAGE_BUCKET, `${base}/dept_ids.json`);
  const entity = await tryLoadJsonArray(STORAGE_BUCKET, `${base}/entity_ids.json`);
  const account = await tryLoadJsonArray(
    STORAGE_BUCKET,
    `${base}/account_codes.json`
  );

  const used = !!(dept?.length || entity?.length || account?.length);
  if (!used) {
    return {
      used: false,
      dept: new Set(),
      entity: new Set(),
      account: new Set(),
      deptCount: 0,
      entityCount: 0,
      accountCount: 0,
      skippedReason: "No reference JSON files found",
    };
  }
  return {
    used: true,
    dept: new Set(dept ?? []),
    entity: new Set(entity ?? []),
    account: new Set(account ?? []),
    deptCount: dept?.length ?? 0,
    entityCount: entity?.length ?? 0,
    accountCount: account?.length ?? 0,
  };
}

// ---- Row Scan ----
const AMOUNT_REGEX = /^-?\d+(?:\.\d{1,2})?$/;
const MONTH_REGEX = /^\d{4}-(\d{2})(?:-\d{2})?$/;

function isBlank(v: string | undefined): boolean {
  return v === undefined || v.trim() === "";
}

function rowScan(
  csvText: string,
  headers: string[],
  orgIdFromCookie: string | null,
  refs: RefSets
): RowScanResult {
  const lines = splitLines(csvText);
  const headerIndex = lines.findIndex((l) => l.trim().length > 0);
  if (headerIndex === -1) {
    return {
      status: "fail",
      checked: 0,
      invalidCount: 1,
      invalid: [{ row: 1, field: "_file", message: "CSV appears empty" }],
      rowCapExceeded: false,
      warnCount: 0,
      warnings: [],
      referentials: {
        used: false,
        deptCount: 0,
        entityCount: 0,
        accountCount: 0,
        skippedReason: "CSV empty",
      },
    };
  }

  const headerRow = lines[headerIndex];
  const tokens = headerRow.split(",").map((t) => t.trim());
  const indexOf: Record<string, number> = {};
  headers.forEach((h) => {
    indexOf[h] = tokens.findIndex((t) => normalizeHeaderToken(t) === h);
  });

  const dataLines = lines.slice(headerIndex + 1);

  let checked = 0;
  let invalidCount = 0;
  const invalid: RowIssue[] = [];
  let rowCapExceeded = false;

  let warnCount = 0;
  const warnings: RowIssue[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const raw = dataLines[i];
    const rowNumber = headerIndex + 1 + i + 1;
    if (raw.trim() === "") continue;

    const cols = raw.split(",").map((c) => c.trim());
    checked++;

    if (checked > MAX_ROWS) {
      rowCapExceeded = true;
      continue;
    }

    const cell = (h: string): string | undefined => {
      const idx = indexOf[h];
      if (idx === -1 || idx === undefined) return undefined;
      return cols[idx];
    };

    const requiredFields = ["org_id", "scenario", "month", "account_code", "amount"] as const;
    for (const f of requiredFields) {
      const v = cell(f);
      if (v === undefined) {
        invalidCount++;
        if (invalid.length < MAX_ISSUES_RETURNED)
          invalid.push({
            row: rowNumber,
            field: f,
            value: undefined,
            message: "Missing required column in this row",
          });
      } else if (isBlank(v)) {
        invalidCount++;
        if (invalid.length < MAX_ISSUES_RETURNED)
          invalid.push({
            row: rowNumber,
            field: f,
            value: v,
            message: "Required value is blank",
          });
      }
    }

    const deptVal = cell("dept_id");
    const entityVal = cell("entity_id");
    const hasEither =
      (deptVal !== undefined && !isBlank(deptVal)) ||
      (entityVal !== undefined && !isBlank(entityVal));
    if (!hasEither) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED)
        invalid.push({
          row: rowNumber,
          field: "dept_id|entity_id",
          message: "At least one of dept_id or entity_id must be provided",
        });
    }

    const monthVal = cell("month");
    if (monthVal !== undefined && !isBlank(monthVal) && !MONTH_REGEX.test(monthVal)) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED)
        invalid.push({
          row: rowNumber,
          field: "month",
          value: monthVal,
          message: "Invalid month format (YYYY-MM or YYYY-MM-DD)",
        });
    }

    const amountVal = cell("amount");
    if (amountVal !== undefined && !isBlank(amountVal) && !AMOUNT_REGEX.test(amountVal)) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED)
        invalid.push({
          row: rowNumber,
          field: "amount",
          value: amountVal,
          message: "Amount must be numeric with up to 2 decimals",
        });
    }

    const orgCell = cell("org_id");
    if (orgIdFromCookie && orgCell && orgCell !== orgIdFromCookie) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED)
        invalid.push({
          row: rowNumber,
          field: "org_id",
          value: orgCell,
          message: "org_id does not match authenticated org",
        });
    }

    if (refs.used) {
      if (!isBlank(deptVal) && !refs.dept.has(deptVal!)) {
        warnCount++;
        if (warnings.length < MAX_ISSUES_RETURNED)
          warnings.push({
            row: rowNumber,
            field: "dept_id",
            value: deptVal!,
            message: "Unknown dept_id (soft warning)",
          });
      }
      if (!isBlank(entityVal) && !refs.entity.has(entityVal!)) {
        warnCount++;
        if (warnings.length < MAX_ISSUES_RETURNED)
          warnings.push({
            row: rowNumber,
            field: "entity_id",
            value: entityVal!,
            message: "Unknown entity_id (soft warning)",
          });
      }
      const accountVal = cell("account_code");
      if (!isBlank(accountVal) && !refs.account.has(accountVal!)) {
        warnCount++;
        if (warnings.length < MAX_ISSUES_RETURNED)
          warnings.push({
            row: rowNumber,
            field: "account_code",
            value: accountVal!,
            message: "Unknown account_code (soft warning)",
          });
      }
    }
  }

  const status: RowScanResult["status"] =
    invalidCount > 0 || rowCapExceeded ? "fail" : "pass";

  return {
    status,
    checked,
    invalidCount,
    invalid,
    rowCapExceeded,
    warnCount,
    warnings,
    referentials: {
      used: refs.used,
      deptCount: refs.deptCount,
      entityCount: refs.entityCount,
      accountCount: refs.accountCount,
      ...(refs.used
        ? {}
        : {
            skippedReason: refs.skippedReason ?? "No reference lists available",
          }),
    },
  };
}

// ---------- 3.4.2 bucketizer ----------
function buildValidationSummary(
  headers: HeaderCheckResult,
  rows: RowScanResult,
  cap: number
) {
  const headerErrors: ValidationBucketItem[] = [];
  const rowErrors: ValidationBucketItem[] = [];
  const referentialWarnings: ValidationBucketItem[] = [];

  if (headers.requiredMissing?.length) {
    for (const h of headers.requiredMissing) {
      headerErrors.push({
        code: "HEADER_MISSING",
        message: `Required header is missing: ${h}`,
        field: h,
      });
    }
  }
  if (headers.eitherMissing?.length) {
    headerErrors.push({
      code: "HEADER_EITHER_MISSING",
      message: `At least one of ${headers.eitherMissing.join(" or ")} must be present.`,
    });
  }
  if (headers.duplicates?.length) {
    for (const h of headers.duplicates) {
      headerErrors.push({
        code: "HEADER_DUPLICATE",
        message: `Duplicate header: ${h}`,
        field: h,
      });
    }
  }
  if (headers.unexpected?.length) {
    for (const h of headers.unexpected) {
      headerErrors.push({
        code: "HEADER_UNEXPECTED",
        message: `Unexpected header: ${h}`,
        field: h,
      });
    }
  }

  if (Array.isArray(rows.invalid)) {
    for (const issue of rows.invalid) {
      rowErrors.push({
        code: "ROW_ERROR",
        message: issue.message,
        row: issue.row,
        field: issue.field,
        value: issue.value,
      });
      if (rowErrors.length >= cap) break;
    }
  }

  if (Array.isArray(rows.warnings)) {
    for (const w of rows.warnings) {
      referentialWarnings.push({
        code: "REFERENTIAL_WARNING",
        message: `Row ${w.row}: ${w.message}`,
        row: w.row,
        field: w.field,
        value: w.value,
      });
      if (referentialWarnings.length >= cap) break;
    }
  }

  const total =
    headerErrors.length + rowErrors.length + referentialWarnings.length;
  const truncated = total > cap;

  return {
    headerErrors: headerErrors.slice(0, cap),
    rowErrors: rowErrors.slice(0, cap),
    referentialWarnings: referentialWarnings.slice(0, cap),
    truncated,
  };
}

// ---------- Routes ----------

export async function GET(req: Request) {
  const meta = {
    route: "/api/validate",
  };
  try {
    const orgId = getCookieOrgIdFromRequest(req);
    return ok(
      {
        version: "phase-3.4.3-xlsx",
        orgId,
        storageBucket: STORAGE_BUCKET,
        now: new Date().toISOString(),
      },
      meta
    );
  } catch (e: any) {
    return fail(
      [
        {
          code: "INTERNAL",
          message: e?.message ?? "Unknown",
        },
      ],
      meta,
      500
    );
  }
}

export async function POST(req: Request) {
  const metaBase = {
    route: "/api/validate",
  };

  const started = Date.now();
  let orgId: string | null = null;
  let uploadId: string | null = null;
  let storagePath: string | null = null;
  let byteLength: number | null = null;

  try {
    const fromQuery = getUploadIdFromRequest(req);
    const body = await readJsonBody<{ uploadId?: string }>(req);
    uploadId = fromQuery || body?.uploadId || "";
    if (!uploadId) {
      const response = fail(
        [
          {
            code: "BAD_REQUEST",
            message: "uploadId is required",
          },
        ],
        metaBase,
        400
      );
      await logPipelineRun({
        route: "/api/validate",
        status: "fail",
        uploadId: null,
        orgId: null,
        durationMs: Date.now() - started,
        errorCode: "BAD_REQUEST",
      });
      return response;
    }

    const headerOrg = req.headers.get("x-org-id");
const cookieOrg = getCookieOrgIdFromRequest(req);
orgId = headerOrg || cookieOrg;
    if (!orgId) {
      const response = fail(
        [
          {
            code: "UNAUTHORIZED",
            message: "Missing org (x-org-id header or bs_org_id cookie)",
          },
        ],
        {
          ...metaBase,
          uploadId,
        },
        401
      );
      await logPipelineRun({
        route: "/api/validate",
        status: "fail",
        uploadId,
        orgId: null,
        durationMs: Date.now() - started,
        errorCode: "UNAUTHORIZED",
      });
      return response;
    }

    const basePath = `org/${orgId}/raw/${uploadId}`;
    const csvPath = `${basePath}.csv`;
    const xlsxPath = `${basePath}.xlsx`;

    const hasCsv = await fileExists(STORAGE_BUCKET, csvPath);
    const hasXlsx = !hasCsv ? await fileExists(STORAGE_BUCKET, xlsxPath) : false;

    if (!hasCsv && !hasXlsx) {
      storagePath = null;
      const response = fail(
        [
          {
            code: "NOT_FOUND",
            message: "Upload not found.",
            details: {
              bucket: STORAGE_BUCKET,
              tried: [csvPath, xlsxPath],
              orgId,
            },
          },
        ],
        {
          ...metaBase,
          uploadId,
          orgId,
        },
        404
      );
      await logPipelineRun({
        route: "/api/validate",
        status: "fail",
        uploadId,
        orgId,
        durationMs: Date.now() - started,
        storagePath: null,
        errorCode: "NOT_FOUND",
      });
      return response;
    }

    // XLSX/CSV dual support
    let csvText: string;
    if (hasCsv) {
      const res = await downloadText(STORAGE_BUCKET, csvPath);
      csvText = res.text;
      byteLength = res.byteLength;
      storagePath = csvPath;
    } else {
      try {
        const { arrayBuffer, byteLength: bl } = await downloadBinary(
          STORAGE_BUCKET,
          xlsxPath
        );
        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        csvText = XLSX.utils.sheet_to_csv(ws);
        byteLength = bl;
        storagePath = xlsxPath;
      } catch (err: any) {
        const response = fail(
          [
            {
              code: "FMT_UNREADABLE_XLSX",
              message: "XLSX file found but could not be parsed.",
              details: {
                bucket: STORAGE_BUCKET,
                path: xlsxPath,
                reason: err?.message,
              },
            },
          ],
          {
            ...metaBase,
            uploadId,
            orgId,
          },
          415
        );
        await logPipelineRun({
          route: "/api/validate",
          status: "fail",
          uploadId,
          orgId,
          durationMs: Date.now() - started,
          storagePath: xlsxPath,
          fileSizeBytes: byteLength ?? null,
          mode: "sync",
          errorCode: "FMT_UNREADABLE_XLSX",
        });
        return response;
      }
    }

    const headers = splitFirstNonEmptyLineAsHeaders(csvText);
    const hCheck = headerCheck(headers);
    const refs = await loadReferenceSets(orgId);

    const rows: RowScanResult =
      hCheck.status === "pass"
        ? rowScan(csvText, hCheck.normalizedHeaders, cookieOrg ?? null, refs)
        : {
            status: "skipped",
            checked: 0,
            invalidCount: 0,
            invalid: [],
            rowCapExceeded: false,
            warnCount: 0,
            warnings: [],
            referentials: {
              used: false,
              deptCount: 0,
              entityCount: 0,
              accountCount: 0,
              skippedReason: "Header check failed",
            },
          };

    const validationSummary = buildValidationSummary(hCheck, rows, MAX_BUCKET_ITEMS);

    const envelopeWarnings =
      rows.warnCount > 0
        ? rows.warnings.map((w) => ({
            code: "REFERENTIAL_WARNING",
            message: `Row ${w.row}: ${w.message}`,
          }))
        : [];

    const hasHardHeaderErrors =
      hCheck.status === "fail" &&
      (hCheck.requiredMissing.length ||
        hCheck.eitherMissing.length ||
        hCheck.duplicates.length ||
        hCheck.unexpected.length);

    const hasHardRowErrors = rows.status === "fail";

    if (hasHardHeaderErrors || hasHardRowErrors) {
      const response = fail(
        [
          {
            code: "VALIDATION_FAILED",
            message: "Validation failed. See details.",
            details: {
              headers: hCheck,
              rows,
              validationSummary,
            },
          },
        ],
        {
          ...metaBase,
          uploadId,
          orgId,
          storagePath,
          mode: "sync",
        },
        200
      );
      await logPipelineRun({
        route: "/api/validate",
        status: "fail",
        uploadId,
        orgId,
        durationMs: Date.now() - started,
        storagePath,
        fileSizeBytes: byteLength ?? null,
        mode: "sync",
        errorCode: "VALIDATION_FAILED",
      });
      return response;
    }

    const response = ok(
      {
        uploadId,
        orgId,
        storagePath,
        csvText,
        byteLength,
        validation: {
          headers: hCheck,
          rows,
        },
        validationSummary,
      },
      {
        ...metaBase,
        uploadId,
        orgId,
        storagePath,
        mode: "sync",
      },
      envelopeWarnings
    );

    await logPipelineRun({
      route: "/api/validate",
      status: "ok",
      uploadId,
      orgId,
      durationMs: Date.now() - started,
      storagePath,
      fileSizeBytes: byteLength ?? null,
      mode: "sync",
    });

    return response;
  } catch (e: any) {
    const response = fail(
      [
        {
          code: "INTERNAL",
          message: e?.message ?? "Unknown",
        },
      ],
      {
        route: "/api/validate",
      },
      500
    );

    await logPipelineRun({
      route: "/api/validate",
      status: "fail",
      uploadId,
      orgId,
      durationMs: Date.now() - started,
      storagePath,
      fileSizeBytes: byteLength ?? null,
      mode: "sync",
      errorCode: "INTERNAL",
    });

    return response;
  }
}

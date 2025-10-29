// app/api/validate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Phase 3.2 — Validation Pipeline
 * Step 3.2.3 — Header Check
 * Step 3.2.4 — Row Scan (types, blanks, row caps)
 * Step 3.2.5 — Referential checks (SOFT WARNINGS ONLY)
 *
 * Reference files (JSON arrays of strings) expected at:
 *   org/{orgId}/reference/dept_ids.json
 *   org/{orgId}/reference/entity_ids.json
 *   org/{orgId}/reference/account_codes.json
 * If not found, referential checks are skipped.
 */

type HeaderCheckResult = {
  status: "pass" | "fail";
  normalizedHeaders: string[];
  requiredMissing: string[];
  eitherMissing: string[]; // both dept_id and entity_id missing in header
  duplicates: string[];
  unexpected: string[];
};

type RowIssue = {
  row: number;        // 1-based CSV line number (header is row 1)
  field: string;      // which field was involved
  value?: string | null;
  message: string;
};

type RowScanResult = {
  status: "pass" | "fail" | "skipped";
  checked: number;
  invalidCount: number;     // hard errors from 3.2.4
  invalid: RowIssue[];
  rowCapExceeded: boolean;
  // 3.2.5 (soft warnings):
  warnCount: number;
  warnings: RowIssue[];
  referentials: {
    used: boolean;          // true if at least one reference set loaded
    deptCount: number;
    entityCount: number;
    accountCount: number;
    skippedReason?: string; // present if referentials not used
  };
};

type ValidateResponse =
  | {
      ok: true;
      data: {
        uploadId: string;
        orgId: string;
        storagePath: string;
        csvText: string;
        byteLength: number;
        validation: {
          headers: HeaderCheckResult;
          rows: RowScanResult;
        };
      };
    }
  | { ok: false; error: { code: string; message: string; debug?: any } };

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

// ❗ Force validate to use the same bucket as upload.
//    No fallback to INGEST_BUCKET to avoid mismatches.
const STORAGE_BUCKET = process.env.UPLOADS_BUCKET || "uploads";

// ---- Config ----
const MAX_ROWS = 50_000;          // MVP cap
const MAX_ISSUES_RETURNED = 200;  // cap returned issues

// ---------- Utils ----------

function getCookieOrgId(): string | null {
  try {
    const store = cookies() as any;
    const cookie = store.get("bs_org_id");
    return cookie?.value ?? null;
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
  const either = ["dept_id", "entity_id"]; // at least one must be present
  const allowed = new Set([...required, ...either]);

  const normalized = headers.map(normalizeHeaderToken);

  // duplicates
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
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

async function downloadText(bucket: string, path: string) {
  const sb = supabase();
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  const buf = await data.arrayBuffer();
  return { text: new TextDecoder("utf-8").decode(buf), byteLength: buf.byteLength };
}

async function fileExists(bucket: string, path: string): Promise<boolean> {
  try {
    const sb = supabase();
    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) return false;
    await data.arrayBuffer(); // consume stream
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

// ---- 3.2.5 referentials loader ----
type RefSets = {
  used: boolean;            // true if at least one list present
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
  const account = await tryLoadJsonArray(STORAGE_BUCKET, `${base}/account_codes.json`);

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

// ---- Row Scan (3.2.4) + soft referentials (3.2.5) ----
const AMOUNT_REGEX = /^-?\d+(?:\.\d{1,2})?$/;
const MONTH_REGEX = /^\d{4}-(\d{2})(?:-\d{2})?$/; // YYYY-MM or YYYY-MM-DD

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
      referentials: { used: false, deptCount: 0, entityCount: 0, accountCount: 0, skippedReason: "CSV empty" },
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

    // ---- Requireds (hard) ----
    const requiredFields = ["org_id", "scenario", "month", "account_code", "amount"] as const;
    for (const f of requiredFields) {
      const v = cell(f);
      if (v === undefined) {
        invalidCount++;
        if (invalid.length < MAX_ISSUES_RETURNED) invalid.push({ row: rowNumber, field: f, value: undefined, message: "Missing required column in this row" });
      } else if (isBlank(v)) {
        invalidCount++;
        if (invalid.length < MAX_ISSUES_RETURNED) invalid.push({ row: rowNumber, field: f, value: v, message: "Required value is blank" });
      }
    }

    // ---- Either dept_id or entity_id present (hard) ----
    const deptVal = cell("dept_id");
    const entityVal = cell("entity_id");
    const hasEither = (deptVal !== undefined && !isBlank(deptVal)) || (entityVal !== undefined && !isBlank(entityVal));
    if (!hasEither) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED) invalid.push({ row: rowNumber, field: "dept_id|entity_id", message: "At least one of dept_id or entity_id must be provided" });
    }

    // ---- Formats (hard) ----
    const monthVal = cell("month");
    if (monthVal !== undefined && !isBlank(monthVal) && !MONTH_REGEX.test(monthVal)) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED) invalid.push({ row: rowNumber, field: "month", value: monthVal, message: "Invalid month format (YYYY-MM or YYYY-MM-DD)" });
    }

    const amountVal = cell("amount");
    if (amountVal !== undefined && !isBlank(amountVal) && !AMOUNT_REGEX.test(amountVal)) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED) invalid.push({ row: rowNumber, field: "amount", value: amountVal, message: "Amount must be numeric with up to 2 decimals" });
    }

    // ---- org_id matches cookie (hard) ----
    const orgCell = cell("org_id");
    if (orgIdFromCookie && orgCell && orgCell !== orgIdFromCookie) {
      invalidCount++;
      if (invalid.length < MAX_ISSUES_RETURNED) invalid.push({ row: rowNumber, field: "org_id", value: orgCell, message: "org_id does not match authenticated org" });
    }

    // ---- 3.2.5 Referentials (SOFT WARNINGS) ----
    if (refs.used) {
      if (!isBlank(deptVal) && !refs.dept.has(deptVal!)) {
        warnCount++;
        if (warnings.length < MAX_ISSUES_RETURNED) warnings.push({ row: rowNumber, field: "dept_id", value: deptVal!, message: "Unknown dept_id (soft warning)" });
      }
      if (!isBlank(entityVal) && !refs.entity.has(entityVal!)) {
        warnCount++;
        if (warnings.length < MAX_ISSUES_RETURNED) warnings.push({ row: rowNumber, field: "entity_id", value: entityVal!, message: "Unknown entity_id (soft warning)" });
      }
      const accountVal = cell("account_code");
      if (!isBlank(accountVal) && !refs.account.has(accountVal!)) {
        warnCount++;
        if (warnings.length < MAX_ISSUES_RETURNED) warnings.push({ row: rowNumber, field: "account_code", value: accountVal!, message: "Unknown account_code (soft warning)" });
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
      ...(refs.used ? {} : { skippedReason: refs.skippedReason ?? "No reference lists available" }),
    },
  };
}

// ---------- Routes ----------

export async function GET() {
  try {
    const orgId = getCookieOrgId();
    return NextResponse.json({
      ok: true,
      data: {
        version: "phase-3.2.5-referentials",
        orgId,
        storageBucket: STORAGE_BUCKET,
        now: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: e?.message ?? "Unknown" } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 1) uploadId
    const fromQuery = getUploadIdFromRequest(req);
    const body = await readJsonBody<{ uploadId?: string }>(req);
    const uploadId = fromQuery || body?.uploadId || "";
    if (!uploadId) {
      return NextResponse.json<ValidateResponse>(
        { ok: false, error: { code: "BAD_REQUEST", message: "uploadId is required" } },
        { status: 400 }
      );
    }

    // 2) orgId (prefer header x-org-id, fallback to cookie)
    const headerOrg = req.headers.get("x-org-id");
    const cookieOrg = getCookieOrgId();
    const orgId = headerOrg || cookieOrg;
    if (!orgId) {
      return NextResponse.json<ValidateResponse>(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Missing org (x-org-id header or bs_org_id cookie)" } },
        { status: 401 }
      );
    }

    // 3) Resolve storage path; try .csv first, then .xlsx
    const basePath = `org/${orgId}/raw/${uploadId}`;
    const csvPath = `${basePath}.csv`;
    const xlsxPath = `${basePath}.xlsx`;

    const hasCsv = await fileExists(STORAGE_BUCKET, csvPath);
    const hasXlsx = !hasCsv ? await fileExists(STORAGE_BUCKET, xlsxPath) : false;

    if (!hasCsv && !hasXlsx) {
      return NextResponse.json<ValidateResponse>(
        {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Upload not found.",
            debug: { bucket: STORAGE_BUCKET, tried: [csvPath, xlsxPath], orgId }
          }
        },
        { status: 404 }
      );
    }

    if (hasXlsx) {
      return NextResponse.json<ValidateResponse>(
        { ok: false, error: { code: "FMT_UNSUPPORTED", message: "XLSX validation not enabled yet—please upload CSV for now." } },
        { status: 415 }
      );
    }

    // 4) Download CSV
    const { text: csvText, byteLength } = await downloadText(STORAGE_BUCKET, csvPath);

    // 5) Header check
    const headers = splitFirstNonEmptyLineAsHeaders(csvText);
    const hCheck = headerCheck(headers);

    // 6) Load referentials (may be skipped if not found)
    const refs = await loadReferenceSets(orgId);

    // 7) Row scan + soft referential warnings (only if headers passed)
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
            referentials: { used: false, deptCount: 0, entityCount: 0, accountCount: 0, skippedReason: "Header check failed" },
          };

    // 8) Respond
    return NextResponse.json<ValidateResponse>({
      ok: true,
      data: {
        uploadId,
        orgId,
        storagePath: csvPath,
        csvText,
        byteLength,
        validation: {
          headers: hCheck,
          rows,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json<ValidateResponse>(
      { ok: false, error: { code: "INTERNAL", message: e?.message ?? "Unknown" } },
      { status: 500 }
    );
  }
}

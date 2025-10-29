// app/api/promotion/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PromoteResponse =
  | {
      ok: true;
      data: {
        jobId: string;
        uploadId: string;
        orgId: string;
        sourcePath: string;
        rowsWritten: number;
        rowsTotal: number;
        invalidCount: number;
        warnCount: number;
        status: "succeeded";
        finishedAt: string;
      };
    }
  | {
      ok: false;
      error: { code: string; message: string; debug?: any };
    };

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const STORAGE_BUCKET = process.env.UPLOADS_BUCKET || "uploads";

// ------------- Helpers -------------
function getCookieOrgId(): string | null {
  try {
    const store = cookies() as any;
    const cookie = store.get("bs_org_id");
    return cookie?.value ?? null;
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


async function copyToNormalized(bucket: string, fromPath: string, toPath: string) {
  const sb = supabase();

  // Try native copy first (fast, server-side)
  // If it isn't available in your SDK, we fallback to download+upload.
  const anyStorage: any = sb.storage.from(bucket) as any;

  if (typeof anyStorage.copy === "function") {
    const { error } = await anyStorage.copy(fromPath, toPath);
    if (error) throw new Error(error.message);
    return;
  }

  // Fallback: download then upload
  const { data, error: dlErr } = await sb.storage.from(bucket).download(fromPath);
  if (dlErr) throw new Error(`download failed: ${dlErr.message}`);

  const buf = await data.arrayBuffer();
  const { error: upErr } = await sb.storage.from(bucket).upload(toPath, buf, {
    upsert: true,
    contentType: "text/csv",
  });
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);
}



function supabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Supabase env not configured");
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

async function downloadCsvText(bucket: string, path: string) {
  const sb = supabase();
  const { data, error } = await sb.storage.from(bucket).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  const buf = await data.arrayBuffer();
  const text = new TextDecoder("utf-8").decode(buf);
  return { text, byteLength: buf.byteLength };
}

function splitLines(csvText: string): string[] {
  return csvText.split(/\r?\n/);
}
function normalizeHeaderToken(h: string): string {
  return h.trim().replace(/^\uFEFF/, "").toLowerCase();
}
function indexHeaders(headerLine: string): Record<string, number> {
  const tokens = headerLine.split(",").map((t) => t.trim());
  const map: Record<string, number> = {};
  tokens.forEach((t, i) => (map[normalizeHeaderToken(t)] = i));
  return map;
}
function getCell(cols: string[], idx: number | undefined) {
  if (idx === undefined || idx < 0) return undefined;
  const v = cols[idx];
  return v === undefined ? undefined : v.trim();
}
function coerceMonthToDate(v: string | undefined): string | null {
  if (!v) return null;
  // Accept YYYY-MM or YYYY-MM-DD; coerce to YYYY-MM-01
  const m = v.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (!m) return null;
  const yyyy = m[1];
  const mm = m[2];
  return `${yyyy}-${mm}-01`;
}
function coerceAmount(v: string | undefined): string | null {
  if (!v) return null;
  const trimmed = v.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return null;
  // round to 2 decimals
  const num = Number(trimmed);
  if (!isFinite(num)) return null;
  return (Math.round(num * 100) / 100).toFixed(2);
}
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ------------- POST: Promote -------------
export async function POST(req: Request) {
  try {
    const body = await readJsonBody<{ uploadId?: string }>(req);
    const uploadId = (body?.uploadId || "").trim();
    if (!uploadId) {
      return NextResponse.json<PromoteResponse>(
        { ok: false, error: { code: "BAD_REQUEST", message: "uploadId is required" } },
        { status: 400 }
      );
    }

    // Resolve orgId (prefer header x-org-id, fallback to cookie)
    const headerOrg = req.headers.get("x-org-id");
    const cookieOrg = getCookieOrgId();
    const orgId = headerOrg || cookieOrg;
    if (!orgId) {
      return NextResponse.json<PromoteResponse>(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Missing org (x-org-id header or bs_org_id cookie)" } },
        { status: 401 }
      );
    }

    // Locate CSV in storage (CSV only in 3.3; XLSX comes in 3.6)
    const sourcePath = `org/${orgId}/raw/${uploadId}.csv`;
    const { text: csvText } = await downloadCsvText(STORAGE_BUCKET, sourcePath);

    // Parse header
    const lines = splitLines(csvText);
    const headerIndex = lines.findIndex((l) => l.trim().length > 0);
    if (headerIndex === -1) {
      return NextResponse.json<PromoteResponse>(
        { ok: false, error: { code: "EMPTY", message: "CSV appears empty" } },
        { status: 400 }
      );
    }
    const headerLine = lines[headerIndex];
    const indexOf = indexHeaders(headerLine);

    const reqCols = ["org_id", "scenario", "month", "account_code", "amount"];
    const missing = reqCols.filter((c) => indexOf[c] === undefined);
    // Require at least one of dept_id | entity_id
    const hasEither =
      indexOf["dept_id"] !== undefined || indexOf["entity_id"] !== undefined;

    if (missing.length || !hasEither) {
      return NextResponse.json<PromoteResponse>(
        {
          ok: false,
          error: {
            code: "BAD_HEADER",
            message:
              "Required columns missing or neither dept_id nor entity_id present",
            debug: { missing, hasEither },
          },
        },
        { status: 400 }
      );
    }

    // Collect rows for insert
    const dataLines = lines.slice(headerIndex + 1);
    const toInsert: any[] = [];
    let rowsTotal = 0;
    let invalidCount = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const raw = dataLines[i];
      if (!raw || raw.trim() === "") continue;
      rowsTotal++;

      const cols = raw.split(",").map((c) => c.trim());

      const orgCell = getCell(cols, indexOf["org_id"]);
      const scenario = getCell(cols, indexOf["scenario"]);
      const monthRaw = getCell(cols, indexOf["month"]);
      const dept = getCell(cols, indexOf["dept_id"]);
      const entity = getCell(cols, indexOf["entity_id"]);
      const account = getCell(cols, indexOf["account_code"]);
      const amountRaw = getCell(cols, indexOf["amount"]);

      // Basic coercions (defensive)
      if (!orgCell || orgCell !== orgId) {
        invalidCount++;
        continue;
      }
      if (!scenario || !account) {
        invalidCount++;
        continue;
      }
      const month = coerceMonthToDate(monthRaw);
      if (!month) {
        invalidCount++;
        continue;
      }
      const amount = coerceAmount(amountRaw);
      if (amount === null) {
        invalidCount++;
        continue;
      }

      // Accept either dept_id or entity_id (or both)
      toInsert.push({
        org_id: orgId,
        upload_id: uploadId,
        row_num: headerIndex + 1 + i + 1, // 1-based file row number
        scenario,
        month, // YYYY-MM-01
        dept_id: dept || null,
        entity_id: entity || null,
        account_code: account,
        amount, // as string; Supabase will coerce to numeric
      });
    }

    // Upsert job row as 'running'
    const sb = supabase();

    const upsertJob = await sb
      .from("ingest_promotions")
      .upsert(
        {
          org_id: orgId,
          upload_id: uploadId,
          source_path: sourcePath,
          status: "running",
          rows_total: rowsTotal,
          rows_written: 0,
          invalid_count: invalidCount,
          warn_count: 0,
          started_at: new Date().toISOString(),
          finished_at: null,
          error_message: null,
        },
        { onConflict: "upload_id" }
      )
      .select("job_id")
      .single();

    if (upsertJob.error) {
      return NextResponse.json<PromoteResponse>(
        {
          ok: false,
          error: {
            code: "JOB_UPSERT_FAILED",
            message: upsertJob.error.message,
          },
        },
        { status: 500 }
      );
    }

    const jobId: string = upsertJob.data.job_id;

    // Idempotency: delete any prior rows for this upload_id
    const del = await sb
      .from("fact_ledger_normalized")
      .delete()
      .eq("org_id", orgId)
      .eq("upload_id", uploadId);

    if (del.error) {
      await sb
        .from("ingest_promotions")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: `Delete prior rows failed: ${del.error.message}`,
        })
        .eq("upload_id", uploadId);
      return NextResponse.json<PromoteResponse>(
        { ok: false, error: { code: "DELETE_FAILED", message: del.error.message } },
        { status: 500 }
      );
    }

    // Insert in chunks
    let rowsWritten = 0;
    const chunks = chunkArray(toInsert, 1000);
    for (const chunk of chunks) {
      if (chunk.length === 0) continue;
      const ins = await sb.from("fact_ledger_normalized").insert(chunk);
      if (ins.error) {
        await sb
          .from("ingest_promotions")
          .update({
            status: "failed",
            rows_written: rowsWritten,
            finished_at: new Date().toISOString(),
            error_message: `Insert failed: ${ins.error.message}`,
          })
          .eq("upload_id", uploadId);
        return NextResponse.json<PromoteResponse>(
          { ok: false, error: { code: "INSERT_FAILED", message: ins.error.message } },
          { status: 500 }
        );
      }
      rowsWritten += chunk.length;
    }

    // --- 3.3.3: Post-promotion verification + final job update ---

    // Re-count rows in ledger to verify written count
    const verify = await sb
      .from("fact_ledger_normalized")
      .select("row_num", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("upload_id", uploadId);

    if (verify.error) {
      await sb
        .from("ingest_promotions")
        .update({
          status: "failed",
          rows_total: rowsTotal,
          rows_written: rowsWritten,
          invalid_count: invalidCount,
          finished_at: new Date().toISOString(),
          error_message: `Verification count failed: ${verify.error.message}`,
        })
        .eq("upload_id", uploadId);
      return NextResponse.json<PromoteResponse>(
        { ok: false, error: { code: "VERIFY_FAILED", message: verify.error.message } },
        { status: 500 }
      );
    }

    const verifiedCount = verify.count ?? 0;
    if (verifiedCount !== rowsWritten) {
      await sb
        .from("ingest_promotions")
        .update({
          status: "failed",
          rows_total: rowsTotal,
          rows_written: rowsWritten,
          invalid_count: invalidCount,
          finished_at: new Date().toISOString(),
          error_message: `Row mismatch: inserted=${rowsWritten}, verified=${verifiedCount}`,
        })
        .eq("upload_id", uploadId);

      return NextResponse.json<PromoteResponse>(
        {
          ok: false,
          error: {
            code: "ROW_MISMATCH",
            message: `Inserted ${rowsWritten} rows, but verified ${verifiedCount} rows in ledger.`,
          },
        },
        { status: 500 }
      );
    }

// --- 3.3.4: Best-effort archival (raw -> normalized) ---
const normalizedPath = `org/${orgId}/normalized/${uploadId}.csv`;
let archiveOk = false;
let archiveError: string | null = null;

try {
  await copyToNormalized(STORAGE_BUCKET, sourcePath, normalizedPath);
  archiveOk = true;
} catch (err: any) {
  archiveOk = false;
  archiveError = err?.message ?? String(err);
  // Do NOT fail the promotion — archival is optional.
}

// Final job update (succeeded), including archival status
const fin = await sb
  .from("ingest_promotions")
  .update({
    status: "succeeded",
    rows_total: rowsTotal,
    rows_written: verifiedCount,
    invalid_count: invalidCount,
    finished_at: new Date().toISOString(),
    normalized_path: normalizedPath,
    archive_ok: archiveOk,
    archive_error: archiveError,
  })
  .eq("upload_id", uploadId)
  .select("job_id, finished_at")
  .single();


    if (fin.error) {
      return NextResponse.json<PromoteResponse>(
        { ok: false, error: { code: "JOB_UPDATE_FAILED", message: fin.error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json<PromoteResponse>({
      ok: true,
      data: {
        jobId,
        uploadId,
        orgId,
        sourcePath,
        rowsWritten,
        rowsTotal,
        invalidCount,
        warnCount: 0,
        status: "succeeded",
        finishedAt: fin.data.finished_at,
      },
    });
  } catch (e: any) {
    return NextResponse.json<PromoteResponse>(
      { ok: false, error: { code: "INTERNAL", message: e?.message ?? "Unknown" } },
      { status: 500 }
    );
  }
}

// ------------- GET: Job status by uploadId -------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uploadId = (url.searchParams.get("uploadId") || "").trim();
    if (!uploadId) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "uploadId is required" } },
        { status: 400 }
      );
    }

    const sb = supabase();
    const job = await sb
      .from("ingest_promotions")
      .select(
        "job_id, org_id, upload_id, status, rows_total, rows_written, invalid_count, warn_count, started_at, finished_at, error_message, source_path"
      )
      .eq("upload_id", uploadId)
      .single();

    if (job.error) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: job.error.message } },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: job.data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: e?.message ?? "Unknown" } },
      { status: 500 }
    );
  }
}

// app/api/promotion/rows/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

function supabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Supabase env not configured");
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function getCookieOrgId(): string | null {
  try {
    const store = cookies() as any;
    const cookie = store.get("bs_org_id");
    return cookie?.value ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uploadId = (url.searchParams.get("uploadId") || "").trim();
    const limitParam = url.searchParams.get("limit");
    const limit = Math.max(
      1,
      Math.min(200, limitParam ? parseInt(limitParam, 10) || 50 : 50)
    );

    if (!uploadId) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "uploadId is required" } },
        { status: 400 }
      );
    }

    // Resolve org (prefer header x-org-id, fallback to cookie)
    const headerOrg = (req.headers.get("x-org-id") || "").trim();
    const cookieOrg = getCookieOrgId();
    const orgId = headerOrg || cookieOrg;
    if (!orgId) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Missing org (x-org-id header or bs_org_id cookie)" } },
        { status: 401 }
      );
    }

    const sb = supabase();

    const rows = await sb
      .from("fact_ledger_normalized")
      .select(
        "row_num, org_id, upload_id, scenario, month, dept_id, entity_id, account_code, amount",
        { count: "exact" }
      )
      .eq("org_id", orgId)
      .eq("upload_id", uploadId)
      .order("row_num", { ascending: true })
      .limit(limit);

    if (rows.error) {
      return NextResponse.json(
        { ok: false, error: { code: "QUERY_FAILED", message: rows.error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        orgId,
        uploadId,
        total: rows.count ?? 0,
        shown: rows.data?.length ?? 0,
        rows: rows.data ?? [],
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: e?.message ?? "Unknown" } },
      { status: 500 }
    );
  }
}

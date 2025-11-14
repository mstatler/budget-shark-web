// app/api/ingest-runs/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const TABLE_NAME = "ingest_runs";

export async function GET() {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await sb
      .from(TABLE_NAME)
      .select(
        "id, created_at, route, status, duration_ms, upload_id, error_code"
      )
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, data: [] },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: (data ?? []).map((r) => ({
          id: r.id,
          createdAt: r.created_at,
          route: r.route,
          status: r.status,
          durationMs: r.duration_ms,
          uploadId: r.upload_id,
          errorCode: r.error_code,
        })),
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error", data: [] },
      { status: 500 }
    );
  }
}

// app/api/_utils/telemetry.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

// keep this untyped / any to avoid TS fighting us about table definitions
let client: any = null;

function getAdminClient(): any {
  if (!client) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase env not configured for telemetry");
    }
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export type PipelineRunStatus = "ok" | "fail";

export type PipelineRunEvent = {
  route: string;
  status: PipelineRunStatus;
  orgId?: string | null;
  uploadId?: string | null;
  durationMs?: number | null;
  storagePath?: string | null;
  fileSizeBytes?: number | null;
  mode?: "sync" | "async" | null;
  errorCode?: string | null;
};

/**
 * Fire-and-forget audit log.
 * We NEVER throw from here – main API must not break if telemetry fails.
 * But we DO log errors to the server console so you can see what’s wrong.
 */
export async function logPipelineRun(event: PipelineRunEvent): Promise<void> {
  try {
    const sb: any = getAdminClient();

    const { error } = await sb.from("ingest_runs").insert({
      org_id: event.orgId ?? null,
      upload_id: event.uploadId ?? null,
      route: event.route,
      status: event.status,
      duration_ms: event.durationMs ?? null,
      storage_path: event.storagePath ?? null,
      file_size_bytes: event.fileSizeBytes ?? null,
      mode: event.mode ?? null,
      error_code: event.errorCode ?? null,
    });

    if (error) {
      // This will show up in your terminal where `npm run dev` is running
      console.error("[telemetry] logPipelineRun insert error:", error.message);
    }
  } catch (err: any) {
    console.error("[telemetry] logPipelineRun threw:", err?.message ?? err);
    // swallow – do not rethrow
  }
}

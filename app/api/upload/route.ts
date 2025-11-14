// app/api/upload/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { ok, fail } from "../_utils/response";
import { logPipelineRun } from "../_utils/telemetry";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const BUCKET_NAME = process.env.UPLOADS_BUCKET || "uploads";

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  const metaBase = { route: "/api/upload" };
  const started = Date.now();

  let orgId: string | null = null;
  let uploadId: string | null = null;
  let storagePath: string | null = null;
  let fileSizeBytes: number | null = null;

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      const response = fail(
        [
          {
            code: "FILE_MISSING",
            message: "No file was uploaded.",
          },
        ],
        metaBase,
        400
      );
      await logPipelineRun({
        route: "/api/upload",
        status: "fail",
        orgId: null,
        uploadId: null,
        durationMs: Date.now() - started,
        fileSizeBytes: null,
        errorCode: "FILE_MISSING",
      });
      return response;
    }

    orgId = req.headers.get("x-org-id") ?? "test";
    uploadId = crypto.randomUUID();
    const ext = extFromName(file.name) || ".csv";
    storagePath = `org/${orgId}/raw/${uploadId}${ext}`;
    fileSizeBytes = file.size;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, await file.arrayBuffer(), {
        upsert: false,
        contentType:
          file.type ||
          (ext === ".csv"
            ? "text/csv"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
      });

    if (error) {
      const response = fail(
        [
          {
            code: "STORAGE",
            message: error.message,
          },
        ],
        {
          ...metaBase,
          orgId,
          uploadId,
          storagePath,
        },
        500
      );

      await logPipelineRun({
        route: "/api/upload",
        status: "fail",
        orgId,
        uploadId,
        durationMs: Date.now() - started,
        storagePath,
        fileSizeBytes,
        errorCode: "STORAGE",
      });

      return response;
    }

    const response = ok(
      {
        uploadId,
        bucket: BUCKET_NAME,
        csvPath: storagePath,
        byteLenStored: file.size,
        orgId,
      },
      {
        ...metaBase,
        orgId,
        uploadId,
        storagePath,
      }
    );

    await logPipelineRun({
      route: "/api/upload",
      status: "ok",
      orgId,
      uploadId,
      durationMs: Date.now() - started,
      storagePath,
      fileSizeBytes,
      mode: "sync",
    });

    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const response = fail(
      [
        {
          code: "INTERNAL",
          message: msg,
        },
      ],
      metaBase,
      500
    );

    await logPipelineRun({
      route: "/api/upload",
      status: "fail",
      orgId,
      uploadId,
      durationMs: Date.now() - started,
      storagePath,
      fileSizeBytes,
      errorCode: "INTERNAL",
    });

    return response;
  }
}

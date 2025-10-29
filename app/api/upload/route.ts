// app/api/upload/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

// Use the SAME envs as validate so both hit the same Supabase project
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

// Bucket alignment
const BUCKET_NAME = process.env.UPLOADS_BUCKET || "uploads";

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return Response.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "file missing" } },
        { status: 400 }
      );
    }

    const orgId = req.headers.get("x-org-id") ?? "test";
    const uploadId = crypto.randomUUID();
    const ext = extFromName(file.name) || ".csv"; // default if unknown
    const storagePath = `org/${orgId}/raw/${uploadId}${ext}`;

    // Create client with the SAME envs as validate
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
      return Response.json(
        { ok: false, error: { code: "STORAGE", message: error.message } },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      data: {
        uploadId,
        bucket: BUCKET_NAME,     // "uploads"
        csvPath: storagePath,    // org/{orgId}/raw/{uploadId}.ext
        byteLenStored: file.size,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json(
      { ok: false, error: { code: "INTERNAL", message: msg } },
      { status: 500 }
    );
  }
}

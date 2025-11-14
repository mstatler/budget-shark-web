// app/api/reference/[entity]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// IMPORTANT: this MUST match whatever /api/upload uses for its bucket.
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type ReferenceEntity = "departments" | "entities" | "accounts";

type ApiWarning = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  warnings: ApiWarning[];
  errors: ApiError[];
  meta: Record<string, unknown>;
};

function mapEntityToPath(entity: ReferenceEntity, orgId: string): string {
  switch (entity) {
    case "departments":
      return `org/${orgId}/reference/dept_ids.json`;
    case "entities":
      return `org/${orgId}/reference/entity_ids.json`;
    case "accounts":
      return `org/${orgId}/reference/account_codes.json`;
    default:
      return `org/${orgId}/reference/unknown.json`;
  }
}

function resolveOrgId(req: NextRequest): string | null {
  const headerOrg = req.headers.get("x-org-id");
  if (headerOrg) return headerOrg;

  const orgId =
    req.cookies.get("bs_org_id")?.value ??
    req.cookies.get("bs_org")?.value ??
    null;

  return orgId;
}

export async function GET(req: NextRequest) {
  // Get entity from path: /api/reference/departments
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const entity = segments[segments.length - 1];

  const supportedEntities: ReferenceEntity[] = [
    "departments",
    "entities",
    "accounts",
  ];

  if (!supportedEntities.includes(entity as ReferenceEntity)) {
    const body: ApiResponse<unknown[]> = {
      ok: false,
      data: [],
      warnings: [],
      errors: [
        {
          code: "unknown_entity",
          message: `Unsupported reference entity: ${entity}`,
          details: { supportedEntities },
        },
      ],
      meta: { entity },
    };

    return NextResponse.json(body, { status: 400 });
  }

  const orgId = resolveOrgId(req);

  if (!orgId) {
    const body: ApiResponse<unknown[]> = {
      ok: false,
      data: [],
      warnings: [],
      errors: [
        {
          code: "missing_org_id",
          message:
            "Unable to determine orgId (expected x-org-id header or bs_org_id / bs_org cookie).",
        },
      ],
      meta: { entity },
    };

    return NextResponse.json(body, { status: 400 });
  }

  const typedEntity = entity as ReferenceEntity;
  const filePath = mapEntityToPath(typedEntity, orgId);

  let data: string[] = [];
  const warnings: ApiWarning[] = [];
  const errors: ApiError[] = [];

  try {
    const { data: fileBlob, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);

    if (error) {
      // For this route, ANY storage error is treated as "missing reference file"
      warnings.push({
        code: "missing_reference_file",
        message: `Reference file not available for ${typedEntity}. Returning an empty list.`,
        details: {
          filePath,
          rawError: error,
        },
      });

      const body: ApiResponse<string[]> = {
        ok: true,
        data: [],
        warnings,
        errors,
        meta: {
          entity: typedEntity,
          orgId,
          filePath,
          updatedAt: null,
        },
      };

      return NextResponse.json(body);
    }

    const text = await fileBlob.text();
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed)) {
      data = parsed as string[];
    } else {
      warnings.push({
        code: "unexpected_reference_shape",
        message:
          "Reference file did not contain a top-level JSON array. Returning empty list.",
        details: { filePath },
      });
      data = [];
    }

    const body: ApiResponse<string[]> = {
      ok: true,
      data,
      warnings,
      errors,
      meta: {
        entity: typedEntity,
        orgId,
        filePath,
        updatedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(body);
  } catch (err) {
    // Extremely defensive: if something truly blows up, still soft-fail
    warnings.push({
      code: "unexpected_error",
      message:
        "Unexpected error while loading reference data. Returning an empty list.",
      details: { filePath, error: String(err) },
    });

    const body: ApiResponse<string[]> = {
      ok: true,
      data: [],
      warnings,
      errors,
      meta: {
        entity: typedEntity,
        orgId,
        filePath,
        updatedAt: null,
      },
    };

    return NextResponse.json(body);
  }
}

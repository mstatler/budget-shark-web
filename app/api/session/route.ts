import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (status: number, body: unknown) =>
  new NextResponse(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function supabaseFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const getCookie = (name: string) => {
    const prefix = name + "=";
    for (const part of cookieHeader.split(";")) {
      const s = part.trim();
      if (s.startsWith(prefix)) return decodeURIComponent(s.slice(prefix.length));
    }
    return undefined;
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, { cookies: { get: getCookie, set() {}, remove() {} } });
}

export async function GET(req: Request) {
  try {
    const supabase = supabaseFromRequest(req);
    const { data } = await supabase.auth.getUser();
    return json(200, { ok: true, data: { user_id: data?.user?.id ?? null } });
  } catch (e: any) {
    return json(500, { ok: false, error: { code: "INTERNAL", message: e?.message ?? "Unknown error" } });
  }
}

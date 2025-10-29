import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Parse body safely
  const { email, source } = await req.json().catch(() => ({} as any));

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Server not configured (missing Supabase envs)" },
      { status: 500 }
    );
  }

  const resp = await fetch(`${url}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify([{ email, source: source ?? "coming-soon" }]),
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ ok: false, error: text }, { status: 500 });
  }

  const data = await resp.json();
  return NextResponse.json({ ok: true, data: data?.[0] ?? null });
}

// app/api/session/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// small helper so we don't repeat JSON headers
const json = (status: number, body: unknown) =>
  new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// create a supabase server client bound to request cookies
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

  return createServerClient(url, anon, {
    cookies: {
      get: getCookie,
      // we set cookies on the Response in POST, so no-op here
      set() {},
      remove() {},
    },
  });
}

// GET = "who am I?"
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const hasBridge = cookieHeader.includes("bs_auth=");

    // if we already have our cookie, we're logged in enough for the app
    if (hasBridge) {
      return json(200, {
        ok: true,
        data: {
          user_id: "bridged-user",
          email: null,
          source: "bs_auth",
        },
      });
    }

    // otherwise, try real Supabase session
    const supabase = supabaseFromRequest(req);
    const { data } = await supabase.auth.getUser();

    return json(200, {
      ok: true,
      data: {
        user_id: data?.user?.id ?? null,
        email: data?.user?.email ?? null,
        source: "supabase",
      },
    });
  } catch (e: any) {
    return json(500, {
      ok: false,
      error: { message: e?.message ?? "Unknown" },
    });
  }
}

// POST = "I just logged in on the client, give me a server-visible cookie"
export async function POST() {
  const res = NextResponse.json({
    ok: true,
    data: { bridged: true, source: "app/api/session/route.ts" },
  });

  // this is what your middleware + dashboard look for
  res.cookies.set("bs_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}

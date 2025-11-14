// app/auth/sign-out/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// helper to sign out of supabase (best effort)
async function signOutSupabase(req: Request) {
  try {
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

    const supabase = createServerClient(url, anon, {
      cookies: {
        get: getCookie,
        set() {},
        remove() {},
      },
    });

    await supabase.auth.signOut();
  } catch {
    // ignore, we still want to clear our own cookie
  }
}

function makeRedirect(req: Request) {
  const res = NextResponse.redirect(new URL("/auth/sign-in", req.url), {
    status: 302,
  });

  // clear our bridge cookie
  res.cookies.set("bs_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // optional: clear supabase cookies too
  res.cookies.set("sb-access-token", "", {
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("supabase-auth-token", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}

export async function POST(req: Request) {
  await signOutSupabase(req);
  return makeRedirect(req);
}

export async function GET(req: Request) {
  await signOutSupabase(req);
  return makeRedirect(req);
}

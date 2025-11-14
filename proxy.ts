// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_EXACT = new Set<string>([
  "/",
  "/auth/sign-in",
  "/auth/sign-out",   // 👈 allow sign-out to run
  "/sign-in",
  "/blog",
  "/privacy",
  "/terms",
  "/api/health",
  "/api/waitlist",
  "/api/session",
  "/api/session/",
  "/favicon.ico",
  "/robots.txt",
]);

const PROTECTED_PREFIXES = ["/upload-test", "/dashboard", "/app"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 👇 this now lets POST /auth/sign-out through
  if (PUBLIC_EXACT.has(pathname)) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSupabase =
    req.cookies.get("sb-access-token") ||
    req.cookies.get("sb:token") ||
    req.cookies.get("supabase-auth-token");

  const hasBridge = req.cookies.get("bs_auth");

  if (hasSupabase || hasBridge) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/auth/sign-in";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|static|.*\\..*).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Which paths are private (require auth)?
const PROTECTED = ["/upload-test", "/dashboard", "/app"];

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes pass through
  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Example auth check (adjust to your cookies/token)
  const hasSession =
    req.cookies.get("sb-access-token") || req.cookies.get("supabase-auth-token");
  if (hasSession) return NextResponse.next();

  // Redirect unauthenticated users to sign-in
  const url = req.nextUrl.clone();
  url.pathname = "/auth/sign-in";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Same matcher as before (applies to all non-static routes)
export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};

// app/auth/sign-in/page.tsx
import { cookies } from "next/headers";
import SignInClient from "./SignInClient";

export default async function SignInPage() {
  const cookieStore = await cookies();
  const hasBridge = cookieStore.get("bs_auth");

  const isLoggedIn = Boolean(hasBridge);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        {isLoggedIn ? (
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-8 space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              You&apos;re signed in ✅
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back. You can go to your dashboard.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-sky-600 text-white px-4 py-2 text-sm font-medium hover:bg-sky-700"
            >
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-8">
            <SignInClient />
          </div>
        )}
      </div>
    </main>
  );
}

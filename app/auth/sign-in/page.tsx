import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-600">Loading sign-in…</div>}>
        <SignInClient />
      </Suspense>
    </main>
  );
}

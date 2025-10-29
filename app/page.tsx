'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/client';

export default function Home() {
  const supabase = useMemo(() => getBrowserClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!ignore) {
        setEmail(data.user?.email ?? null);
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!ignore) setEmail(session?.user?.email ?? null);
    });

    return () => {
      ignore = true;
      sub.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  const isLoggedIn = !!email;

  async function handleSignOut() {
    await supabase.auth.signOut();
    location.reload();
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-50 dark:bg-black text-black dark:text-zinc-50 font-sans">
      <h1 className="text-4xl font-extrabold mb-4 text-emerald-600 dark:text-emerald-400">
        Budget Shark
      </h1>

      <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400 text-center max-w-lg">
        {isLoggedIn
          ? `Welcome back, ${email || 'user'}!`
          : 'Securely track your finances. Sign in to get started.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {isLoggedIn ? (
          <>
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-emerald-600 px-6 font-semibold text-white transition-opacity hover:opacity-90 shadow-lg"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="h-12 rounded-full border px-6 font-semibold transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/auth/sign-in"
            className="flex h-12 items-center justify-center rounded-full border border-solid border-emerald-600 px-6 font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-zinc-800"
          >
            Go to Sign-In
          </Link>
        )}
      </div>
    </main>
  );
}

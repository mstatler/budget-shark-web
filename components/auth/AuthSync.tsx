'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';

/**
 * Keeps Supabase auth state and server session in sync.
 * Mount once (in app/layout.tsx) so it runs globally.
 */
export default function AuthSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserClient();

    // Warm once on mount to ensure the server component gets the initial session
    fetch('/api/session', { cache: 'no-store' }).catch(() => {});

    // data: subscription is destructuring the returned object.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      // After any sign-in/out event (e.g., from a SignOutButton click):
      // 1. Invalidate the Next.js App Router cache via the server API route
      await fetch('/api/session', { cache: 'no-store' }).catch(() => {});
      // 2. Force a hard refresh of the page to re-evaluate the auth state
      router.refresh();
    });

    return () => {
      // Clean up the listener when the component is unmounted
      subscription.unsubscribe(); 
    };
  }, [router]);

  return null;
}

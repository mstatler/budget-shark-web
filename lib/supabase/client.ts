// lib/supabase/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  // Prevent re-initializing during HMR in dev
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: SupabaseClient | undefined;
}

/**
 * Get a single shared Supabase browser client.
 * Safe to import from multiple client components; returns the same instance.
 */
export function getBrowserClient(): SupabaseClient {
  const g = globalThis as unknown as { __supabaseBrowserClient?: SupabaseClient };

  if (!g.__supabaseBrowserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    g.__supabaseBrowserClient = createBrowserClient(url, anon);
  }
  return g.__supabaseBrowserClient!;
}

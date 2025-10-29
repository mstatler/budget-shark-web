// lib/context.ts
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Make this async so we can await Next's dynamic APIs
export async function getServerSupabase() {
  // Next 15+ dynamic APIs are async
  const cookieStore = await cookies();

  // Minimal cookie bridge (guards + local casts to keep TS quiet)
  const cookieBridge = {
    get(name: string) {
      // cookieStore.get exists in route handlers; optional chain to be safe
      return (cookieStore as any).get?.(name)?.value as string | undefined;
    },
    set(name: string, value: string, options: Record<string, any>) {
      if (typeof (cookieStore as any).set === 'function') {
        (cookieStore as any).set({ name, value, ...options });
      }
    },
    remove(name: string, options: Record<string, any>) {
      if (typeof (cookieStore as any).set === 'function') {
        (cookieStore as any).set({ name, value: '', ...options, maxAge: 0 });
      }
    },
  } as {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: Record<string, any>) => void;
    remove: (name: string, options: Record<string, any>) => void;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieBridge as any }
  );

  return supabase;
}

export async function getServerContext() {
  const c = await cookies();   // async dynamic API
  const h = await headers();   // async dynamic API

  const supabase = await getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const orgId = (c as any).get?.('org_id')?.value ?? null;

  return {
    supabase,
    session,
    user: session?.user ?? null,
    orgId,
    headers: h,
  };
}

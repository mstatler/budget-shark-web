// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client bound to Next.js cookies.
 * Works in RSC / route handlers in Next 15/16.
 */
export async function getServerClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const client = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // we don't set/remove here; pages/routes will set cookies on the Response
      set() {},
      remove() {},
    },
  });

  return client;
}

// alias so you can import { createSupabaseServerClient }
export const createSupabaseServerClient = getServerClient;

// 👇 important: also export default so imports like
// `import getServerClient from "@/lib/supabase/server";` work
export default getServerClient;

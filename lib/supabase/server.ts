import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This function creates a Supabase client configured to run on the server (in API routes, 
// Server Components, etc.). It is crucial for security and reading cookies correctly.
export function createSupabaseServerClient() {
  // CRITICAL FIX: Cast the result of cookies() to 'any' immediately 
  // to prevent TypeScript from complaining about the .get method signature.
  const cookieStore = cookies() as any; 

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // The '.get(name)' method returns an object; we only need the value.
          // The error should now be gone because cookieStore is typed as 'any'.
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // No need for 'as any' here anymore, as cookieStore is already 'any'
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          // No need for 'as any' here anymore, as cookieStore is already 'any'
          cookieStore.delete(name, options);
        },
      },
    }
  );
}

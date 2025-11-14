// env.d.ts
namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    APP_BASE_URL?: string;
    // server-only
    SUPABASE_SERVICE_ROLE_KEY?: string;
  }
}

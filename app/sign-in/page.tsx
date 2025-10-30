// app/sign-in/page.tsx

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <p className="text-sm text-slate-500 mb-6">
          Placeholder sign-in page. We&apos;ll hook this to Supabase later.
        </p>
        <form className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}

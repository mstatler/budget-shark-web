import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Budget Shark
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/blog" className="hover:text-sky-600">
            Blog
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-20 text-center">
        <p className="mx-auto inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100 dark:bg-sky-900/40 dark:text-sky-100">
          Coming soon
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cleaner budgeting &amp; forecasting for teams
        </h1>
        <p className="text-slate-500 dark:text-slate-300">
          thebudgetshark.com is getting ready. Join the waitlist and we&apos;ll invite you when we open onboarding.
        </p>

        {/* Waitlist form */}
        <form
          className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
          action="/api/waitlist"
          method="POST"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="submit"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Join waitlist
          </button>
        </form>
      </section>
    </main>
  );
}

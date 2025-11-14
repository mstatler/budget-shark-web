// app/blog/why-budget-shark/page.tsx
import Link from "next/link";
import WaitlistCTA from "@/components/WaitlistCTA";

export default function WhyBudgetSharkPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-slate-500 mb-4">
        <Link href="/blog" className="hover:underline">
          ← Back to blog
        </Link>
      </p>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Why Budget Shark</h1>
      <p className="text-sm text-slate-400 mb-8">October 30, 2025</p>

      <article className="prose prose-slate dark:prose-invert">
        <p>
          Budget Shark is my attempt to take the budgeting/forecasting process I&apos;ve been doing at my day job and
          make it simpler, repeatable, and way less spreadsheet-y. Most teams end up with scattered Excel files,
          emailed versions, weird column orders, and no single source of truth.
        </p>
        <p>
          What I want is: upload → validate → promote → report. And I want department heads to be able to submit
          without breaking the template.
        </p>
        <p>
          So the site you&apos;re on right now (thebudgetshark.com) is the early marketing surface for that tool. While
          I&apos;m building out the ingest pipeline, I want to collect emails of people who want to try it as soon as
          I&apos;m ready.
        </p>
      </article>

      {/* CTA */}
      <WaitlistCTA />
    </main>
  );
}

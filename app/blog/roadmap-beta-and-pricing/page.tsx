// app/blog/roadmap-beta-and-pricing/page.tsx
import Link from "next/link";
import WaitlistCTA from "@/components/WaitlistCTA";

export default function RoadmapBetaAndPricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-slate-500 mb-4">
        <Link href="/blog" className="hover:underline">
          ← Back to blog
        </Link>
      </p>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Budget Shark Beta &amp; Pricing Roadmap</h1>
      <p className="text-sm text-slate-400 mb-8">October 30, 2025</p>

      <article className="prose prose-slate dark:prose-invert">
        <p>
          I&apos;m planning a phased rollout: first a small batch of people who already know budgeting pain, then a
          slightly wider group once the upload/validate flow is stable. Pricing will start simple (few tiers) and get
          more advanced once forecasting is live.
        </p>
        <p>
          If you&apos;re here from LinkedIn or Google, join the waitlist below so I know who to invite first.
        </p>
      </article>

      {/* CTA */}
      <WaitlistCTA />
    </main>
  );
}

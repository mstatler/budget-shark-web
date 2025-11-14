"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import "./styles/landing.css";

import WaitlistForm from "@/components/WaitlistForm";

export default function HomePage() {
  return (
    <main className="landing">
      {/* Top bar */}
      <header className="landing-topbar" role="banner">
        <Link href="/" className="landing-brand" aria-label="Budget Shark home">
          <Image
            src="/images/budget-shark-logo.png"
            alt="Budget Shark logo"
            width={160}
            height={48}
            className="landing-logo"
            priority
          />
        </Link>

        <nav className="landing-nav" aria-label="Primary">
          <Link href="/blog" className="landing-nav-link">
            Blog
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-hero" aria-labelledby="hero-title">
        <span className="landing-pill">Coming soon</span>

        <h1 id="hero-title" className="landing-title">
          Cleaner budgeting &amp; forecasting for teams
        </h1>

        <p className="landing-subtitle">
          Upload → validate → promote → report. Built for finance teams who are
          done juggling twelve Excel versions in email threads.
        </p>

        {/* Waitlist */}
        <div className="landing-card" role="region" aria-label="Join the waitlist">
          <p className="landing-card-lead">Join the Budget Shark waitlist 👇</p>
          <WaitlistForm />
          <p className="landing-footnote">No spam. Just early access.</p>
        </div>

        {/* Value grid */}
        <div className="landing-grid" aria-label="Highlights">
          <article className="landing-tile">
            <h3 className="landing-tile-title">Upload fast</h3>
            <p className="landing-tile-text">
              Drop CSVs from your finance team, properties, or departments. Front-load
              the checks so your numbers flow cleanly.
            </p>
          </article>

          <article className="landing-tile">
            <h3 className="landing-tile-title">Validate easily</h3>
            <p className="landing-tile-text">
              Header and row checks before promotion—aligned with the pipeline we’re
              building.
            </p>
          </article>

          <article className="landing-tile">
            <h3 className="landing-tile-title">Forecast clearly</h3>
            <p className="landing-tile-text">
              Month, YTD, and scenario views mapped to your tier roadmap.
            </p>
          </article>
        </div>

        <p className="landing-madeby">
          Built by Matt at <strong>thebudgetshark.com</strong>
        </p>
      </section>
    </main>
  );
}

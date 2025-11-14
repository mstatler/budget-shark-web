"use client";

import * as React from "react";

export default function WaitlistForm() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();

    // basic inline validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list. We'll be in touch soon.");
        form.reset();
      } else {
        setStatus("error");
        setMessage(json?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="waitlist-form" noValidate>
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          autoComplete="email"
          className="waitlist-input"
          aria-describedby="waitlist-help"
          aria-invalid={status === "error" ? "true" : "false"}
          disabled={status === "loading"}
        />

        <button
          type="submit"
          className="waitlist-button"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </form>

      <p id="waitlist-help" className="sr-only">
        Enter your email to be notified when Budget Shark opens onboarding.
      </p>

      {status === "success" && (
        <p className="waitlist-msg waitlist-msg--ok" role="status" aria-live="polite">
          {message}
        </p>
      )}
      {status === "error" && (
        <p className="waitlist-msg waitlist-msg--err" role="alert" aria-live="assertive">
          {message}
        </p>
      )}
    </div>
  );
}

/* Visually-hidden utility, local to this file via CSS-in-JS is awkward;
   add this to landing.css if you want to re-use globally:

.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}
*/

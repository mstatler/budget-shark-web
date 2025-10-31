// components/WaitlistCTA.tsx
"use client";

import { useState } from "react";

export default function WaitlistCTA() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("ok");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-semibold mb-2">Join the Budget Shark waitlist</h2>
      <p className="text-sm text-slate-500 mb-4">
        Get invited when uploads, validation, and forecasting are ready.
      </p>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Join
        </button>
      </form>
      {status === "ok" && (
        <p className="mt-3 text-sm text-green-600">Thanks — you’re on the list.</p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-red-600">Hmm, that didn’t work. Try again.</p>
      )}
    </div>
  );
}

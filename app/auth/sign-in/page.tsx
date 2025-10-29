"use client";

import * as React from "react";

export default function Home() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "submitting" | "ok" | "err">("idle");
  const [msg, setMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "landing" }),
      });
      const json = await res.json();
      if (json?.ok) {
        setStatus("ok");
        setMsg("Thanks! You’re on the list. We’ll email you when the beta opens.");
        setEmail("");
      } else {
        setStatus("err");
        setMsg(json?.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setStatus("err");
      setMsg(err?.message || "Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Budget Shark — Coming Soon</h1>
        <p className="text-gray-600">
          Cleaner budgeting & forecasting. Fewer spreadsheets. Faster answers.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 justify-center">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full sm:w-72 rounded border border-gray-300 px-3 py-2"
          />
          <button
            disabled={status === "submitting"}
            className={`rounded px-4 py-2 text-white ${
              status === "submitting" ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-900"
            }`}
          >
            {status === "submitting" ? "Adding…" : "Notify me"}
          </button>
        </form>

        {msg && (
          <p className={`text-sm ${status === "ok" ? "text-green-700" : "text-red-700"}`}>{msg}</p>
        )}

        <p className="text-xs text-gray-500">We’ll only email you about the beta launch.</p>
      </div>
    </main>
  );
}

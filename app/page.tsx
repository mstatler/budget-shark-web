"use client";

import * as React from "react";

export default function Home() {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle"|"submitting"|"ok"|"err">("idle");
  const [msg, setMsg] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting"); setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "coming-soon" }),
      });
      const json = await res.json();
      if (json?.ok) { setState("ok"); setMsg("Thanks! You're on the list."); setEmail(""); }
      else { setState("err"); setMsg(json?.error || "Please try again."); }
    } catch (err: any) {
      setState("err"); setMsg(err?.message || "Network error.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Budget Shark — Coming Soon</h1>
        <p className="text-gray-600">Cleaner budgeting & forecasting. Fewer spreadsheets.</p>

        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 justify-center">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full sm:w-72 rounded border border-gray-300 px-3 py-2"
          />
          <button
            disabled={state==="submitting"}
            className={`rounded px-4 py-2 text-white ${state==="submitting" ? "bg-gray-500" : "bg-black hover:bg-gray-900"}`}
          >
            {state==="submitting" ? "Adding…" : "Notify me"}
          </button>
        </form>

        {msg && <p className={`text-sm ${state==="ok" ? "text-green-700" : "text-red-700"}`}>{msg}</p>}
        <p className="text-xs text-gray-500">We’ll only email you about the beta launch.</p>
      </div>
    </main>
  );
}

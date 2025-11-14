"use client";

import { useEffect, useState } from "react";

type IngestRun = {
  id: string;
  createdAt: string;
  route: string;
  status: "ok" | "fail";
  durationMs: number | null;
  uploadId: string | null;
  errorCode: string | null;
};

export default function IngestRunsClient() {
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/ingest-runs", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          const text = await res.text();
          if (!cancelled) {
            setError(
              `Failed to load runs (${res.status}): ${
                text || "Unknown error"
              }`
            );
          }
          return;
        }

        const json = await res.json();
        if (!cancelled) {
          setRuns((json?.data as IngestRun[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load runs.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasRuns = runs.length > 0;
  const lastRun = hasRuns ? runs[0] : null;
  const successCount = runs.filter((r) => r.status === "ok").length;
  const failCount = runs.filter((r) => r.status === "fail").length;

  const lastRunLabel = lastRun
    ? new Date(lastRun.createdAt).toLocaleString()
    : "—";
  const lastRunStatusLabel = lastRun ? lastRun.status.toUpperCase() : "—";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Recent ingest runs
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            Uploads, validations, and other ingest activity for this org.
          </p>
        </div>
        <div className="text-[11px] text-slate-400">
          {loading ? (
            <span className="italic">Loading…</span>
          ) : (
            <span>
              Showing <span className="font-semibold">{runs.length}</span> run
              {runs.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid gap-3 md:grid-cols-3 text-xs">
          {/* Last status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Last status
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold ${
                  lastRun?.status === "ok"
                    ? "bg-emerald-100 text-emerald-700"
                    : lastRun?.status === "fail"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {lastRunStatusLabel}
              </span>
              {lastRun?.errorCode && (
                <span className="text-[11px] text-slate-500 truncate">
                  ({lastRun.errorCode})
                </span>
              )}
            </div>
          </div>

          {/* Last run time */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Last run
            </span>
            <span className="text-sm font-medium text-slate-700">
              {lastRunLabel}
            </span>
          </div>

          {/* OK / Failed counts */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Run quality
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-emerald-700">
                  {successCount}
                </span>
                <span className="text-[11px] text-slate-500">OK</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-red-600">
                  {failCount}
                </span>
                <span className="text-[11px] text-slate-500">Failed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Empty state */}
      {!loading && !error && !hasRuns && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          No ingest runs yet. Upload a file on{" "}
          <a href="/upload-test" className="underline font-medium">
            the Upload Tool
          </a>{" "}
          and run validation — your activity will appear here.
        </div>
      )}

      {/* Table */}
      {hasRuns && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold text-slate-600">
                  Time
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-600">
                  Route
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-600">
                  Status
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-600">
                  Duration
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-600">
                  Upload ID
                </th>
                <th className="py-2.5 px-3 font-semibold text-slate-600">
                  Error
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                >
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-slate-500">{run.route}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${
                        run.status === "ok"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-500">
                    {run.durationMs != null ? `${run.durationMs} ms` : "—"}
                  </td>
                  <td className="py-2 px-3 text-slate-500 truncate max-w-[180px]">
                    {run.uploadId || "—"}
                  </td>
                  <td className="py-2 px-3 text-slate-500">
                    {run.errorCode || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

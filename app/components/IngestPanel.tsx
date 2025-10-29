"use client";

import * as React from "react";

// --- helpers ---
function getCookie(name: string): string {
  return (
    document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.split("=")[1] ?? ""
  );
}

type JobSummary = {
  status?: string;
  rows_total?: number;
  rows_written?: number;
  invalid_count?: number;
  finished_at?: string | null;
  normalized_path?: string | null;
  archive_ok?: boolean | null;
} | null;

export default function IngestPanel() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState("No file chosen");
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const [result, setResult] = React.useState<string>("");
  const [manualUploadId, setManualUploadId] = React.useState("");
  const [lastUploadId, setLastUploadId] = React.useState("");
  const [job, setJob] = React.useState<JobSummary>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // ensure org cookie for local testing
  React.useEffect(() => {
    if (!document.cookie.includes("bs_org_id")) {
      document.cookie =
        "bs_org_id=3164b5e3-1f46-46a3-b890-c99b797a3722; Path=/; SameSite=Lax";
    }
  }, []);

  const org = React.useMemo(
    () => getCookie("bs_org_id") || getCookie("bs_active_org"),
    []
  );

  // --- actions ---
  function onPick() {
    inputRef.current?.click();
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f ? f.name : "No file chosen");
  }
  function onClear() {
    setFile(null);
    setFileName("No file chosen");
    setProgress(0);
    setResult("");
    setJob(null);
  }

  async function onUpload() {
    if (!file) {
      setResult("Please choose a CSV or XLSX file first.");
      return;
    }
    setIsUploading(true);
    setProgress(0);
    setResult("");

    const fd = new FormData();
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.withCredentials = true;
    if (org) xhr.setRequestHeader("x-org-id", org);

    xhr.upload.onprogress = (evt: ProgressEvent<EventTarget>) => {
      if (evt.lengthComputable) {
        const pct = Math.max(
          0,
          Math.min(100, Math.round((evt.loaded / evt.total) * 100))
        );
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      try {
        const json = JSON.parse(xhr.responseText);
        setResult(JSON.stringify(json, null, 2));
        const id =
          json?.data && typeof json.data.uploadId === "string"
            ? json.data.uploadId
            : "";
        if (json?.ok && id) {
          setLastUploadId(id);
          setManualUploadId(id);
        }
      } catch {
        setResult("Error: Could not parse response.");
      }
    };
    xhr.onerror = () => {
      setIsUploading(false);
      setResult("Error: Upload failed (network).");
    };

    xhr.send(fd);
  }

  async function onValidate() {
    const useId = manualUploadId.trim();
    if (!useId) {
      setResult("Enter an uploadId (or upload a file first).");
      return;
    }
    setResult("Validating (read-only)…");

    const res = await fetch("/api/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(org ? { "x-org-id": org } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ uploadId: useId }),
    });

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } else {
      const text = await res.text();
      setResult(text || `HTTP ${res.status} (non-JSON response)`);
    }
  }

  async function onPromote() {
    const useId = manualUploadId.trim();
    if (!useId) {
      setResult("Enter an uploadId (or upload first) before promoting.");
      return;
    }
    const res = await fetch("/api/promotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(org ? { "x-org-id": org } : {}),
      },
      body: JSON.stringify({ uploadId: useId }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
    // Quick capture for summary row
    if (json?.ok && json?.data) {
      setJob({
        status: json.data.status,
        rows_total: json.data.rowsTotal ?? json.data.rows_total,
        rows_written: json.data.rowsWritten ?? json.data.rows_written,
        invalid_count: json.data.invalidCount ?? json.data.invalid_count,
        finished_at: json.data.finishedAt ?? json.data.finished_at,
        normalized_path: json.data.normalized_path ?? null,
        archive_ok: json.data.archive_ok ?? null,
      });
    }
  }

  async function onJobStatus() {
    const useId = manualUploadId.trim();
    if (!useId) {
      setResult("Enter an uploadId to check job status.");
      return;
    }
    const res = await fetch(
      `/api/promotion?uploadId=${encodeURIComponent(useId)}`
    );
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
    if (json?.ok && json?.data) {
      setJob({
        status: json.data.status,
        rows_total: json.data.rows_total,
        rows_written: json.data.rows_written,
        invalid_count: json.data.invalid_count,
        finished_at: json.data.finished_at,
        normalized_path: json.data.normalized_path,
        archive_ok: json.data.archive_ok,
      });
    }
  }

  async function onPreview() {
    const useId = manualUploadId.trim();
    if (!useId) {
      setResult("Enter an uploadId to preview posted rows.");
      return;
    }
    const res = await fetch(
      `/api/promotion/rows?uploadId=${encodeURIComponent(useId)}&limit=50`,
      { headers: { ...(org ? { "x-org-id": org } : {}) } }
    );
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }

  const barColor = !isUploading && progress > 0 ? "bg-green-600" : "bg-blue-600";

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Ingest Pipeline</h2>

      {/* Upload */}
      <div className="rounded border border-gray-200 p-4 space-y-3">
        <h3 className="font-medium">1) Upload</h3>
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={onPick}
            className="rounded px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Browse
          </button>
          <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUpload}
              disabled={isUploading}
              className={`rounded px-4 py-2 text-white ${
                isUploading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isUploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={isUploading}
              className="rounded px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {(isUploading || progress > 0) && (
          <div className="w-full bg-gray-200 rounded h-4 overflow-hidden mt-1">
            <div className={`${barColor} h-4 transition-all`} style={{ width: `${progress}%` }}>
              <span
                className={`block text-center text-xs font-medium ${
                  progress < 10 ? "text-gray-800" : "text-white"
                }`}
              >
                {progress}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Validate / Promote / Preview */}
      <div className="rounded border border-gray-200 p-4 space-y-3">
        <h3 className="font-medium">2) Validate • 3) Promote • 4) Preview</h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Upload ID"
            value={manualUploadId}
            onChange={(e) => setManualUploadId(e.target.value)}
            className="w-full sm:flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={onValidate}
            className="rounded px-4 py-2 bg-gray-800 text-white hover:bg-gray-900"
          >
            Validate (read-only)
          </button>
          <button
            type="button"
            onClick={onPromote}
            className="rounded px-4 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            Promote (post to ledger)
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="rounded px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Preview posted rows
          </button>
          <button
            type="button"
            onClick={onJobStatus}
            className="rounded px-4 py-2 bg-slate-600 text-white hover:bg-slate-700"
          >
            Refresh job status
          </button>
        </div>

        {lastUploadId && (
          <p className="text-xs text-gray-600">
            Last uploadId:&nbsp;
            <code className="px-1 py-0.5 bg-gray-100 rounded">{lastUploadId}</code>
          </p>
        )}

        {/* Job summary pills */}
        {job && (
          <div className="text-xs text-gray-700 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <span className="inline-block rounded bg-gray-100 px-2 py-1">
              Status: <strong>{job.status || "?"}</strong>
            </span>
            <span className="inline-block rounded bg-gray-100 px-2 py-1">
              Rows: <strong>{job.rows_written ?? 0}</strong> / {job.rows_total ?? 0}
            </span>
            <span className="inline-block rounded bg-gray-100 px-2 py-1">
              Invalid: <strong>{job.invalid_count ?? 0}</strong>
            </span>
            <span className="inline-block rounded bg-gray-100 px-2 py-1">
              Finished: <strong>{job.finished_at || "—"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Output */}
      <div>
        <h3 className="font-medium">Result</h3>
        <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto min-h-[140px]">
          {result || "Result will appear here…"}
        </pre>
      </div>
    </section>
  );
}

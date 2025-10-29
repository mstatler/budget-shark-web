"use client";

import * as React from "react";

// Helper to read cookies from document.cookie
function getCookie(name: string): string {
  return (
    document.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.split("=")[1] ?? ""
  );
}

export default function UploadTestPage(): JSX.Element {
  const [result, setResult] = React.useState<string>("");
  const [lastUploadId, setLastUploadId] = React.useState<string>("");
  const [manualUploadId, setManualUploadId] = React.useState<string>("");
  const [fileName, setFileName] = React.useState<string>("No file chosen");
  const [file, setFile] = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // TEMP: ensure org cookie exists for local testing
  React.useEffect(() => {
    if (!document.cookie.includes("bs_org_id")) {
      document.cookie =
        "bs_org_id=3164b5e3-1f46-46a3-b890-c99b797a3722; Path=/; SameSite=Lax";
    }
  }, []);

  function onPickClick(): void {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f ? f.name : "No file chosen");
    // debug to verify we actually have a File
    // eslint-disable-next-line no-console
    console.log("Selected file:", f?.name, f?.size, f?.type);
  }

  function onClear(): void {
    setFile(null);
    setFileName("No file chosen");
    setProgress(0);
    setResult("");
  }

  async function onUpload(): Promise<void> {
    if (!file) {
      setResult("Please choose a CSV or XLSX file first.");
      return;
    }

    setResult("");
    setProgress(0);
    setIsUploading(true);

    try {
      const fd = new FormData();
      // field name MUST be "file"
      fd.append("file", file, file.name);

      const org = getCookie("bs_org_id") || getCookie("bs_active_org");

      // Use fetch so the browser sets the multipart boundary correctly.
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          ...(org ? { "x-org-id": org } : {}),
          // do NOT set Content-Type manually for multipart/form-data
        },
        body: fd,
        credentials: "include",
      });

      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json")
        ? await res.json()
        : await res.text();

      setIsUploading(false);
      setProgress(100);

      if (!res.ok) {
        setResult(
          typeof payload === "string"
            ? `HTTP ${res.status}: ${payload}`
            : JSON.stringify(payload, null, 2)
        );
        return;
      }

      setResult(JSON.stringify(payload, null, 2));

      const id =
        payload?.data && typeof payload.data.uploadId === "string"
          ? payload.data.uploadId
          : "";

      if (payload?.ok && id) {
        setLastUploadId(id);
        setManualUploadId(id);
      }
    } catch (err) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : String(err);
      setResult(`Error: ${msg}`);
    }
  }

  const barColor = !isUploading && progress > 0 ? "bg-green-600" : "bg-blue-600";

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-xl font-semibold">Upload &amp; Validate Test</h1>

      {/* ===== Upload section ===== */}
      <section style={{ marginTop: 48, padding: 24, borderTop: "1px solid #ddd" }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>CSV Upload Test</h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={onFileChange}
          />

          <button
            type="button"
            onClick={onPickClick}
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
              title="Clear selection and output"
            >
              Clear
            </button>
          </div>
        </div>

        {(isUploading || progress > 0) && (
          <div
            className="w-full bg-gray-200 rounded h-4 overflow-hidden mt-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Upload progress"
          >
            <div
              className={`${barColor} h-4 transition-all duration-150 relative`}
              style={{ width: `${progress}%` }}
            >
              <span
                className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${
                  progress < 10 ? "text-gray-800" : "text-white"
                }`}
              >
                {progress}%
              </span>
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-gray-200" />

      {/* ===== Validate section ===== */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Upload ID"
            value={manualUploadId}
            onChange={(e) => setManualUploadId(e.target.value)}
            className="w-full sm:flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              const useId = manualUploadId.trim();
              if (!useId) {
                setResult("Enter an uploadId (or upload a file first).");
                return;
              }
              setResult("Validating (read-only)…");
              try {
                const org = getCookie("bs_org_id") || getCookie("bs_active_org");
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
                const out = ct.includes("application/json") ? await res.json() : await res.text();
                setResult(typeof out === "string" ? out : JSON.stringify(out, null, 2));
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setResult(`Error: ${msg}`);
              }
            }}
            className="rounded px-4 py-2 bg-gray-800 text-white hover:bg-gray-900"
          >
            Validate (read CSV)
          </button>
        </div>

        {lastUploadId && (
          <p className="text-xs text-gray-600">
            Last uploadId:&nbsp;
            <code className="px-1 py-0.5 bg-gray-100 rounded">{lastUploadId}</code>
          </p>
        )}
      </section>



<button
  type="button"
  onClick={async () => {
    if (!manualUploadId.trim()) {
      setResult("Enter an uploadId (or upload first) before promoting.");
      return;
    }
    const res = await fetch("/api/promotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": getCookie("bs_org_id") || getCookie("bs_active_org"),
      } as any,
      body: JSON.stringify({ uploadId: manualUploadId.trim() }),
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }}
  className="rounded px-4 py-2 bg-green-600 text-white hover:bg-green-700"
>
  Promote (post to ledger)
</button>


<button
  type="button"
  onClick={async () => {
    const useId = manualUploadId.trim();
    if (!useId) {
      setResult("Enter an uploadId to preview posted rows.");
      return;
    }
    const org = getCookie("bs_org_id") || getCookie("bs_active_org");
    const res = await fetch(`/api/promotion/rows?uploadId=${encodeURIComponent(useId)}&limit=50`, {
      headers: { ...(org ? { "x-org-id": org } : {}) },
    });
    const json = await res.json();
    setResult(JSON.stringify(json, null, 2));
  }}
  className="rounded px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700"
>
  Preview Posted Rows (top 50)
</button>



      <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
        {result || "Result will appear here…"}
      </pre>

      <p className="text-xs text-gray-500">
        Signed-in session required. Org id read from <code>bs_org_id</code> cookie.
      </p>
    </main>
  );
}

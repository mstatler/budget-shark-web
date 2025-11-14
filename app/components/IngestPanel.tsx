"use client";

import * as React from "react";
import styles from "./IngestPanel.module.css";

// --- helpers ---
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const cookieString = document.cookie || "";
  const parts = cookieString.split(";");
  for (const part of parts) {
    const s = part.trim();
    if (s.startsWith(name + "=")) {
      return decodeURIComponent(s.slice(name.length + 1));
    }
  }
  return "";
}

type JobSummary =
  | {
      status?: string;
      rows_total?: number;
      rows_written?: number;
      invalid_count?: number;
      finished_at?: string | null;
      normalized_path?: string | null;
      archive_ok?: boolean | null;
    }
  | null;

export default function IngestPanel() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState("No file chosen");
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const [result, setResult] = React.useState<string>("");
  const [manualUploadId, setManualUploadId] = React.useState("");
  const [lastUploadId, setLastUploadId] = React.useState("");
  const [job, setJob] = React.useState<JobSummary>(null);

  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // ensure org cookie for local testing (runs only in browser)
  React.useEffect(() => {
    if (typeof document !== "undefined" && !document.cookie.includes("bs_org_id")) {
      document.cookie =
        "bs_org_id=3164b5e3-1f46-46a3-b890-c99b797a3722; Path=/; SameSite=Lax";
    }
  }, []);

  const org = React.useMemo(
    () => getCookie("bs_org_id") || getCookie("bs_active_org"),
    []
  );

  // --- file picking / drag & drop ---
  function onPick() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f ? f.name : "No file chosen");
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function onClear() {
    setFile(null);
    setFileName("No file chosen");
    setProgress(0);
    setResult("");
    setJob(null);
  }

  // --- actions ---
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
        const json: unknown = JSON.parse(xhr.responseText);
        setResult(JSON.stringify(json, null, 2));

        const id =
          (json as { data?: { uploadId?: string }; ok?: boolean })?.data
            ?.uploadId ?? "";

        if ((json as { ok?: boolean })?.ok && id) {
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
    const res = await fetch(`/api/promotion?uploadId=${encodeURIComponent(useId)}`);
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

  const showProgress = isUploading || progress > 0;

  return (
    <section className={styles.shell}>
      <h2 className={styles.title}>Upload • Validate • Promote • Preview</h2>

      {/* Step 1: Upload */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.stepPill}>Step 1</span>
          <h3 className={styles.cardTitle}>Upload File</h3>
        </div>

        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          className={styles.hiddenInput}
          onChange={onFileChange}
        />

        <div
          className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          aria-label="Drag and drop a CSV or XLSX file here"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPick();
          }}
        >
          <div className={styles.fileRow}>
            <div className={styles.fileMeta}>
              <div className={styles.fileIcon} aria-hidden />
              <div className={styles.fileName} title={fileName}>
                {fileName}
              </div>
            </div>

            <div className={styles.fileActions}>
              <button
                type="button"
                onClick={onPick}
                className={`${styles.btn} ${styles.btnGhost}`}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={onUpload}
                disabled={isUploading}
                className={`${styles.btn} ${styles.btnPrimary} ${
                  isUploading ? styles.btnDisabled : ""
                }`}
              >
                {isUploading ? "Uploading…" : "Upload"}
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={isUploading}
                className={`${styles.btn} ${styles.btnSubtle}`}
              >
                Clear
              </button>
            </div>
          </div>

          {showProgress && (
            <div className={styles.progressWrap}>
              <div
                className={`${styles.progressBar} ${
                  !isUploading && progress > 0 ? styles.progressSuccess : ""
                }`}
                style={{ width: `${progress}%` }}
              >
                <span className={styles.progressText}>{progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Steps 2–4: Process */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.stepPill}>Steps 2–4</span>
          <h3 className={styles.cardTitle}>Process Data</h3>
        </div>

        <div className={styles.controlsRow}>
          <input
            type="text"
            placeholder="Upload ID"
            value={manualUploadId}
            onChange={(e) => setManualUploadId(e.target.value)}
            className={styles.input}
          />

          <button type="button" onClick={onValidate} className={`${styles.btn} ${styles.btnDark}`}>
            Validate (read-only)
          </button>

          <button type="button" onClick={onPromote} className={`${styles.btn} ${styles.btnSuccess}`}>
            Promote (post to ledger)
          </button>

          <button type="button" onClick={onPreview} className={`${styles.btn} ${styles.btnPurple}`}>
            Preview posted rows
          </button>

          <button type="button" onClick={onJobStatus} className={`${styles.btn} ${styles.btnSlate}`}>
            Refresh job status
          </button>
        </div>

        {lastUploadId && (
          <p className={styles.subtleNote}>
            Last uploadId:&nbsp;<code className={styles.code}>{lastUploadId}</code>
          </p>
        )}

        {job && (
          <div className={styles.pillsGrid}>
            <span className={styles.pill}>
              Status: <strong>{job.status || "?"}</strong>
            </span>
            <span className={styles.pill}>
              Rows: <strong>{job.rows_written ?? 0}</strong> / {job.rows_total ?? 0}
            </span>
            <span className={styles.pill}>
              Invalid: <strong>{job.invalid_count ?? 0}</strong>
            </span>
            <span className={styles.pill}>
              Finished: <strong>{job.finished_at || "—"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Result console */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Result</h3>
        </div>
        <pre className={styles.console} aria-live="polite">
          {result || "Result will appear here…"}
        </pre>
      </div>
    </section>
  );
}

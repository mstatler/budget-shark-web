"use client";

// ✅ Safe wrappers for document / window / localStorage access in Next.js

export function safeDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

export function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

export function getCookie(name: string): string {
  const doc = safeDocument();
  if (!doc) return "";
  return (
    doc.cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.split("=")[1] ?? ""
  );
}

export function lsGet(key: string): string {
  const w = safeWindow();
  if (!w) return "";
  try {
    return w.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function lsSet(key: string, val: string) {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(key, val);
  } catch {}
}

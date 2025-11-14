'use client';

// lib/client/api.ts
export type Ok<T>  = { ok: true } & T;
export type Err    = { ok: false; error: { code: string; message: string } };
export type ApiResult<T> = Ok<T> | Err;

export async function getJSON<T>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  return (await res.json()) as ApiResult<T>;
}
console.log('api.ts loaded');
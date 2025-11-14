// app/api/_utils/response.ts

type Warning = {
  code: string;
  message: string;
};

type Err = {
  code: string;
  message: string;
  details?: unknown;
};

type Envelope<T> = {
  ok: boolean;
  data: T | null;
  warnings: Warning[];
  errors: Err[];
  meta?: Record<string, unknown>;
};

export function ok<T>(
  data: T,
  meta: Record<string, unknown> = {},
  warnings: Warning[] = []
): Response {
  const body: Envelope<T> = {
    ok: true,
    data,
    warnings,
    errors: [],
    meta,
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function fail(
  errors: Err[],
  meta: Record<string, unknown> = {},
  status = 400
): Response {
  const body: Envelope<null> = {
    ok: false,
    data: null,
    warnings: [],
    errors,
    meta,
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// app/api/org/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const cookieName = 'bs_active_org';
const cookieOpts = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

export async function GET() {
  const c = await cookies(); // Next 15: dynamic API is async
  return NextResponse.json({
    ok: true,
    org_id: c.get?.(cookieName)?.value ?? null,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const org_id = typeof body?.org_id === 'string' ? body.org_id : undefined;

    if (!org_id) {
      return NextResponse.json(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'org_id (string) is required' } },
        { status: 400 }
      );
    }

    const c = await cookies();
    // Route handlers have a writable cookie store; guard just in case
    (c as any).set?.(cookieName, org_id, cookieOpts);

    return NextResponse.json({ ok: true, org_id });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: err?.message ?? 'Unknown error' } },
      { status: 500 }
    );
  }
}

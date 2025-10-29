// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // ⬇️ await the dynamic APIs
    const cookieStore = await cookies();
    const hdrs = await headers();

    const orgId = cookieStore.get?.('org_id')?.value ?? null;
    const host = hdrs.get?.('host') ?? null;

    return NextResponse.json({
      ok: true,
      data: {
        version: 'phase-1-minimal',
        org_id: orgId,
        host,
        now: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    // Belt & suspenders: return a friendly error payload
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL', message: err?.message ?? 'Unknown error' } },
      { status: 500 }
    );
  }
}

// app/api/ping/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // avoid edge/runtime oddities in dev

export async function GET() {
  return NextResponse.json({ ok: true, pong: true });
}

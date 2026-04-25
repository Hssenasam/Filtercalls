import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getRecentPublicReports } from '@/lib/reputation/store';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? '10');
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.floor(rawLimit))) : 10;

  const db = getD1();
  if (!db) return NextResponse.json([], { headers: { 'Cache-Control': 'public, max-age=3600' } });

  try {
    const rows = await getRecentPublicReports(db, limit);
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }
}

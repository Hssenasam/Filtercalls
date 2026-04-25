import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { buildSummaryForHashPrefix, safeEmptySummary } from '@/lib/reputation/store';

export const runtime = 'edge';

export async function GET(_request: NextRequest, { params }: { params: { hash: string } }) {
  const hash = params.hash.trim().toLowerCase();
  if (!/^[a-f0-9]{12,64}$/.test(hash)) return NextResponse.json(safeEmptySummary(hash.slice(0, 12)), { headers: { 'Cache-Control': 'public, max-age=120' } });

  const db = getD1();
  if (!db) return NextResponse.json(safeEmptySummary(hash.slice(0, 12)), { headers: { 'Cache-Control': 'public, max-age=120' } });

  try {
    const summary = await buildSummaryForHashPrefix(db, hash);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'public, max-age=120' } });
  } catch {
    return NextResponse.json(safeEmptySummary(hash.slice(0, 12)), { headers: { 'Cache-Control': 'public, max-age=120' } });
  }
}

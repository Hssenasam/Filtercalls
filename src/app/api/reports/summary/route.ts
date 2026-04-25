import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { validatePhoneNumberInput } from '@/lib/phone';
import { buildSummaryForNumber, safeEmptySummary } from '@/lib/reputation/store';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const number = request.nextUrl.searchParams.get('number') ?? '';
  const validation = validatePhoneNumberInput(number, 'US');
  if (validation.state !== 'valid') return NextResponse.json(safeEmptySummary(), { headers: { 'Cache-Control': 'public, max-age=60' } });

  const db = getD1();
  if (!db) return NextResponse.json(safeEmptySummary(), { headers: { 'Cache-Control': 'public, max-age=60' } });

  try {
    const summary = await buildSummaryForNumber(db, validation.canonicalNumber);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch {
    return NextResponse.json(safeEmptySummary(), { headers: { 'Cache-Control': 'public, max-age=60' } });
  }
}

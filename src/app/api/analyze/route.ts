import { NextResponse } from 'next/server';
import { analyzeNumberV2 } from '@/lib/engine';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { number, country } = (await request.json()) as { number?: string; country?: string };

    if (!number || number.trim().length < 7) {
      return NextResponse.json({ error: 'Invalid number supplied' }, { status: 400 });
    }

    const search = new URL(request.url).searchParams;
    const queryFresh = search.get('fresh') === '1';

    const { result, cacheStatus } = await analyzeNumberV2(number, country, queryFresh);
    const response = NextResponse.json(result, { status: 200 });
    response.headers.set('x-fc-cache', cacheStatus);
    return response;
  } catch (error) {
    if (error instanceof Error && (error.message === 'COUNTRY_REQUIRED' || error.message === 'INVALID_NUMBER')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Analysis request failed' }, { status: 500 });
  }
}

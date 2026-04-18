import { NextRequest, NextResponse } from 'next/server';
import { getPhoneProvider } from '@/lib/providers/phone-provider';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { number, country } = (await request.json()) as { number?: string; country?: string };

    if (!number || number.trim().length < 7) {
      return NextResponse.json({ error: 'Invalid number supplied' }, { status: 400 });
    }

    const provider = getPhoneProvider();
    const result = await provider.analyze(number, country);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Analysis request failed' }, { status: 500 });
  }
}

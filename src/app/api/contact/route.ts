import { NextRequest, NextResponse } from 'next/server.js';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    name?: string;
    email?: string;
    type?: string;
    message?: string;
  };

  if (!payload.name || !payload.email || !payload.message || !payload.type) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, receivedAt: new Date().toISOString() });
}

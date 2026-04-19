import { NextRequest, NextResponse } from 'next/server';
import { getPhoneProvider } from '@/lib/providers/phone-provider';
import {
  authenticateApiKey,
  dispatchWebhooks,
  enforceRateLimit,
  getDb,
  optionsResponse,
  persistAnalysis,
  resolveRequestId,
  withResponseHeaders
} from '@/lib/server/phase3';

export const runtime = 'edge';

export const OPTIONS = async () => optionsResponse();

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);

  try {
    const { number, country } = (await request.json()) as { number?: string; country?: string };

    if (!number || number.trim().length < 7) {
      return withResponseHeaders(NextResponse.json({ error: 'Invalid number supplied' }, { status: 400 }), requestId);
    }

    const db = getDb();
    const apiKey = request.headers.get('x-api-key');
    const apiKeyRecord = await authenticateApiKey(db, apiKey);

    if (apiKey && !apiKeyRecord) {
      return withResponseHeaders(NextResponse.json({ error: 'Invalid API key' }, { status: 401 }), requestId);
    }

    if (apiKeyRecord) {
      const limitResult = await enforceRateLimit(request, apiKeyRecord.id, apiKeyRecord.rate_limit_per_min ?? 60);
      if (!limitResult.ok) return withResponseHeaders(limitResult.response, requestId);
    }

    const provider = getPhoneProvider();
    const result = await provider.analyze(number, country);

    await persistAnalysis(db, requestId, { number, country, apiKeyId: apiKeyRecord?.id }, result);

    if (apiKeyRecord) {
      void dispatchWebhooks(db, apiKeyRecord.id, 'analysis.completed', { request_id: requestId, result });
    }

    return withResponseHeaders(NextResponse.json(result), requestId);
  } catch {
    return withResponseHeaders(NextResponse.json({ error: 'Analysis request failed' }, { status: 500 }), requestId);
  }
}

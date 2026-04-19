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

const MAX_BATCH_SIZE = 25;

type BatchItem = { number?: string; country?: string; id?: string };

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);

  try {
    const body = (await request.json()) as { items?: BatchItem[] };
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_BATCH_SIZE) {
      return withResponseHeaders(
        NextResponse.json({ error: `items must be an array between 1 and ${MAX_BATCH_SIZE}` }, { status: 400 }),
        requestId
      );
    }

    const db = getDb();
    const apiKey = request.headers.get('x-api-key');
    const apiKeyRecord = await authenticateApiKey(db, apiKey);

    if (!apiKeyRecord) {
      return withResponseHeaders(NextResponse.json({ error: 'Valid API key required for batch endpoint' }, { status: 401 }), requestId);
    }

    const limitResult = await enforceRateLimit(request, apiKeyRecord.id, apiKeyRecord.rate_limit_per_min ?? 60);
    if (!limitResult.ok) return withResponseHeaders(limitResult.response, requestId);

    const provider = getPhoneProvider();
    const results = [] as Array<{ id?: string; result?: unknown; error?: string }>;

    for (const item of body.items) {
      if (!item.number || item.number.trim().length < 7) {
        results.push({ id: item.id, error: 'Invalid number supplied' });
        continue;
      }

      const result = await provider.analyze(item.number, item.country);
      await persistAnalysis(db, crypto.randomUUID(), { number: item.number, country: item.country, apiKeyId: apiKeyRecord.id }, result);
      results.push({ id: item.id, result });
    }

    void dispatchWebhooks(db, apiKeyRecord.id, 'analysis.completed', { request_id: requestId, batch_size: body.items.length });

    return withResponseHeaders(NextResponse.json({ request_id: requestId, count: results.length, results }), requestId);
  } catch {
    return withResponseHeaders(NextResponse.json({ error: 'Batch analysis request failed' }, { status: 500 }), requestId);
  }
}

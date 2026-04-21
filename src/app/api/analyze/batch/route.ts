import { NextRequest, NextResponse } from 'next/server.js';
import { getPhoneProvider } from '@/lib/providers/phone-provider';
import {
  authenticateApiKey,
  dispatchWebhooks,
  enforceRateLimit,
  errorResponse,
  getDb,
  optionsResponse,
  persistAnalysis,
  resolveRequestId,
  withResponseHeaders
} from '@/lib/server/phase3';
import { assertLimit } from '@/lib/billing/state';

export const runtime = 'edge';

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

const MAX_BATCH_SIZE = 100;

type BatchItem = { number?: string; country?: string; id?: string };

type BatchResult = { id?: string; result?: unknown; error?: { code: string; message: string } };

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);

  try {
    const body = (await request.json()) as { items?: BatchItem[] };
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_BATCH_SIZE) {
      return errorResponse(requestId, 'BATCH_TOO_LARGE', `items must be an array between 1 and ${MAX_BATCH_SIZE}`, 400);
    }

    const db = getDb();
    if (!db) {
      return errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503);
    }

    const apiKey = request.headers.get('x-api-key');
    const apiKeyRecord = await authenticateApiKey(db, apiKey);

    if (!apiKeyRecord) {
      return errorResponse(requestId, 'UNAUTHORIZED', 'Valid API key required for batch endpoint', 401);
    }

    if (apiKeyRecord.user_id) {
      const planCheck = await assertLimit(db, apiKeyRecord.user_id, { type: 'analyses', amount: body.items.length });
      if (!planCheck.ok) {
        return errorResponse(requestId, 'PLAN_LIMIT_EXCEEDED', `Monthly analysis limit reached (${planCheck.limit}) for current plan`, 402);
      }
    }

    const limitResult = await enforceRateLimit(request, apiKeyRecord.id, apiKeyRecord.rate_limit_per_min ?? 60, body.items.length);
    if (!limitResult.ok) return withResponseHeaders(limitResult.response, requestId);

    const provider = getPhoneProvider();
    const results: BatchResult[] = [];

    for (const item of body.items) {
      if (!item.number || item.number.trim().length < 7) {
        results.push({ id: item.id, error: { code: 'INVALID_NUMBER', message: 'Invalid number supplied' } });
        continue;
      }

      const result = await provider.analyze(item.number, item.country);
      const analysisId = crypto.randomUUID();
      await persistAnalysis(analysisId, { number: item.number, country: item.country, apiKeyId: apiKeyRecord.id, userId: apiKeyRecord.user_id ?? null }, result);
      void dispatchWebhooks({ request, apiKeyId: apiKeyRecord.id, userId: apiKeyRecord.user_id ?? null, analysisId, riskScore: result.risk_score, payload: result });
      results.push({ id: item.id, result });
    }

    return withResponseHeaders(NextResponse.json({ request_id: requestId, count: results.length, results }), requestId);
  } catch {
    return errorResponse(requestId, 'BATCH_ANALYZE_FAILED', 'Batch analysis request failed', 500);
  }
}

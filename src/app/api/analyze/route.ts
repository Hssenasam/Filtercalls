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

export const runtime = 'edge';

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);

  try {
    const { number, country } = (await request.json()) as { number?: string; country?: string };

    if (!number || number.trim().length < 7) {
      return errorResponse(requestId, 'INVALID_NUMBER', 'Invalid number supplied', 400);
    }

    const db = getDb();
    const apiKey = request.headers.get('x-api-key');
    if (apiKey && !db) {
      return errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503);
    }

    const apiKeyRecord = await authenticateApiKey(db, apiKey);

    if (apiKey && !apiKeyRecord) {
      return errorResponse(requestId, 'UNAUTHORIZED', 'Invalid API key', 401);
    }

    if (apiKeyRecord) {
      const limitResult = await enforceRateLimit(request, apiKeyRecord.id, apiKeyRecord.rate_limit_per_min ?? 60, 1);
      if (!limitResult.ok) return withResponseHeaders(limitResult.response, requestId);
    }

    const provider = getPhoneProvider();
    const result = await provider.analyze(number, country);

    await persistAnalysis(requestId, { number, country, apiKeyId: apiKeyRecord?.id, userId: apiKeyRecord?.user_id ?? null }, result);

    if (apiKeyRecord) {
      void dispatchWebhooks({ request, apiKeyId: apiKeyRecord.id, userId: apiKeyRecord.user_id ?? null, analysisId: requestId, riskScore: result.risk_score, payload: result });
    }

    return withResponseHeaders(NextResponse.json(result), requestId);
  } catch {
    return errorResponse(requestId, 'ANALYZE_FAILED', 'Analysis request failed', 500);
  }
}

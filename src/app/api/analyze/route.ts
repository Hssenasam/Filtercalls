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
import { getSessionUser } from '@/lib/auth/portal';
import { getD1 } from '@/lib/db/d1';

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

    // NEW: session-based auth for browser users
    if (!apiKey) {
      const d1 = getD1();
      if (!d1) return errorResponse(requestId, 'DB_UNAVAILABLE', 'Database unavailable', 503);

      const user = await getSessionUser(d1, request);
      if (!user) {
        return errorResponse(requestId, 'UNAUTHORIZED', 'Login required to run analysis', 401);
      }
    }

    if (apiKey && !db) {
      return errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503);
    }

    const apiKeyRecord = await authenticateApiKey(db, apiKey);

    if (apiKey && !apiKeyRecord) {
      return errorResponse(requestId, 'UNAUTHORIZED', 'Invalid API key', 401);
    }

    if (apiKeyRecord) {
      if (apiKeyRecord.user_id) {
        const planCheck = await assertLimit(db!, apiKeyRecord.user_id, { type: 'analyses', amount: 1 });
        if (!planCheck.ok) {
          return errorResponse(requestId, 'PLAN_LIMIT_EXCEEDED', `Monthly analysis limit reached (${planCheck.limit}) for current plan`, 402);
        }
      }
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

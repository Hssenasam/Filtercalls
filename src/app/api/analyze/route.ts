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

const VALID_ISO_PATTERN = /^[A-Z]{2}$/;
const SAFE_NUMBER_PATTERN = /^[+\d\s\-().]{7,20}$/;

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(requestId, 'INVALID_JSON', 'Request body must be valid JSON', 400);
    }

    if (typeof body !== 'object' || body === null) {
      return errorResponse(requestId, 'INVALID_BODY', 'Request body must be an object', 400);
    }

    const { number, country } = body as Record<string, unknown>;

    if (
      typeof number !== 'string' ||
      !number.trim() ||
      number.trim().length < 7 ||
      number.trim().length > 20
    ) {
      return errorResponse(requestId, 'INVALID_NUMBER', 'number must be a string between 7 and 20 characters', 400);
    }

    if (!SAFE_NUMBER_PATTERN.test(number.trim())) {
      return errorResponse(requestId, 'INVALID_NUMBER', 'number contains invalid characters', 400);
    }

    if (
      country !== undefined &&
      (typeof country !== 'string' || !VALID_ISO_PATTERN.test(country.toUpperCase()))
    ) {
      return errorResponse(requestId, 'INVALID_COUNTRY', 'country must be a valid ISO 3166-1 alpha-2 code (e.g. "US", "DZ")', 400);
    }

    const safeNumber = number.trim();
    const safeCountry = typeof country === 'string' ? country.toUpperCase() : undefined;

    const db = getDb();
    const apiKey = request.headers.get('x-api-key');
    let sessionUserId: string | null = null;

    if (!apiKey) {
      const d1 = getD1();
      if (!d1) return errorResponse(requestId, 'DB_UNAVAILABLE', 'Database unavailable', 503);

      const user = await getSessionUser(d1, request);
      if (!user) {
        return errorResponse(requestId, 'UNAUTHORIZED', 'Login required to run analysis', 401);
      }
      sessionUserId = user.id;

      const planCheck = await assertLimit(d1, user.id, { type: 'analyses', amount: 1 });
      if (!planCheck.ok) {
        return errorResponse(requestId, 'PLAN_LIMIT_EXCEEDED', `Monthly analysis limit reached (${planCheck.limit}) for current plan`, 402);
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
    const result = await provider.analyze(safeNumber, safeCountry);

    await persistAnalysis(
      requestId,
      { number: safeNumber, country: safeCountry, apiKeyId: apiKeyRecord?.id, userId: apiKeyRecord?.user_id ?? sessionUserId },
      result
    );

    if (apiKeyRecord) {
      void dispatchWebhooks({
        request,
        apiKeyId: apiKeyRecord.id,
        userId: apiKeyRecord.user_id ?? null,
        analysisId: requestId,
        riskScore: result.risk_score,
        payload: result
      });
    }

    return withResponseHeaders(NextResponse.json(result), requestId);
  } catch (err) {
    console.error('[analyze/route] Unhandled error:', err instanceof Error ? err.message : String(err));
    return errorResponse(requestId, 'ANALYZE_FAILED', 'Analysis request failed', 500);
  }
}

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
import { validatePhoneNumberInput } from '@/lib/phone';

export const runtime = 'edge';

const VALID_ISO_PATTERN = /^[A-Z]{2}$/;
const GUEST_ANALYSIS_COOKIE = 'fc_guest_analysis_used';

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

const markGuestAnalysisUsed = (response: NextResponse) => {
  response.cookies.set(GUEST_ANALYSIS_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
};

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

    if (typeof number !== 'string' || !number.trim()) {
      return errorResponse(requestId, 'INVALID_NUMBER', 'number must be a non-empty string', 400);
    }

    if (
      country !== undefined &&
      (typeof country !== 'string' || !VALID_ISO_PATTERN.test(country.toUpperCase()))
    ) {
      return errorResponse(requestId, 'INVALID_COUNTRY', 'country must be a valid ISO 3166-1 alpha-2 code (e.g. "US", "DZ")', 400);
    }

    const safeCountry = typeof country === 'string' ? country.toUpperCase() : 'US';
    const validation = validatePhoneNumberInput(number.trim(), safeCountry);

    if (validation.state !== 'valid') {
      return errorResponse(
        requestId,
        validation.state === 'incomplete' ? 'INCOMPLETE_NUMBER' : 'INVALID_NUMBER',
        validation.message ?? 'Use a complete phone number in international format.',
        400
      );
    }

    const safeNumber = validation.canonicalNumber;
    const resolvedCountry = validation.inferredCountryIso ?? safeCountry;

    const db = getDb();
    const apiKey = request.headers.get('x-api-key');
    let sessionUserId: string | null = null;
    let isGuestAnalysis = false;

    if (!apiKey) {
      const d1 = getD1();
      const user = d1 ? await getSessionUser(d1, request) : null;

      if (!user) {
        if (request.cookies.get(GUEST_ANALYSIS_COOKIE)?.value === '1') {
          return errorResponse(
            requestId,
            'GUEST_LIMIT_REACHED',
            'Create a free account to unlock more caller-intelligence reports.',
            403
          );
        }
        isGuestAnalysis = true;
      } else {
        sessionUserId = user.id;
        const planCheck = await assertLimit(d1!, user.id, { type: 'analyses', amount: 1 });
        if (!planCheck.ok) {
          return errorResponse(requestId, 'PLAN_LIMIT_EXCEEDED', `Monthly analysis limit reached (${planCheck.limit}) for current plan`, 402);
        }
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
    const result = await provider.analyze(safeNumber, resolvedCountry);

    await persistAnalysis(
      requestId,
      { number: safeNumber, country: resolvedCountry, apiKeyId: apiKeyRecord?.id, userId: apiKeyRecord?.user_id ?? sessionUserId },
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

    const response = withResponseHeaders(NextResponse.json(result), requestId);
    return isGuestAnalysis ? markGuestAnalysisUsed(response) : response;
  } catch (err) {
    console.error('[analyze/route] Unhandled error:', err instanceof Error ? err.message : String(err));
    return errorResponse(requestId, 'ANALYZE_FAILED', 'Analysis request failed', 500);
  }
}

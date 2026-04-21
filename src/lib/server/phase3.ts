import { NextRequest, NextResponse } from 'next/server.js';
import type { CallIntentAnalysis } from '@/lib/engine/types';
import { authenticateApiKey as authKey } from '@/lib/auth/api-key';
import { getD1, safeRun } from '@/lib/db/d1';
import { dispatchAnalysisWebhooks } from '@/lib/webhooks/dispatch';
import { enforceRateLimit as enforceRate } from '@/lib/rate-limit';
import { corsHeaders, resolveRequestIdFromHeaders } from './phase3-core';

export const resolveRequestId = (request: NextRequest) => resolveRequestIdFromHeaders(request.headers);
export const getDb = () => getD1();

const clientIp = (request: NextRequest) => request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anonymous';

export const withResponseHeaders = (response: NextResponse, requestId: string) => {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set('X-Request-ID', requestId);
  return response;
};

export const optionsResponse = (requestId?: string) => withResponseHeaders(new NextResponse(null, { status: 204 }), requestId ?? crypto.randomUUID());

export const errorResponse = (requestId: string, code: string, message: string, status: number) =>
  withResponseHeaders(NextResponse.json({ error: { code, message } }, { status }), requestId);

export const authenticateApiKey = authKey;

export const enforceRateLimit = async (request: NextRequest, apiKeyId: string, rateLimitPerMin = 60, amount = 1) => {
  const result = await enforceRate({ apiKeyId, ip: clientIp(request), rateLimitPerMin, amount });
  if (result.ok) return { ok: true as const };

  const response = NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded' } }, { status: 429 });
  response.headers.set('Retry-After', String(result.retryAfterSeconds));
  return { ok: false as const, response };
};

export const persistAnalysis = async (
  requestId: string,
  payload: { number: string; country?: string; apiKeyId?: string | null; userId?: string | null },
  analysis: CallIntentAnalysis
) => {
  const db = getD1();
  if (!db) return false;

  return safeRun(async () => {
    await db
      .prepare(
        'INSERT INTO analyses (id, created_at, e164, country, risk_score, risk_level, engine_version, cache_status, layers_json, api_key_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        requestId,
        Date.now(),
        analysis.normalized_number ?? payload.number,
        payload.country ?? null,
        analysis.risk_score,
        analysis.nuisance_level,
        'engine-v2',
        'miss',
        JSON.stringify(analysis.signals),
        payload.apiKeyId ?? null,
        payload.userId ?? null
      )
      .run();
  });
};

export const dispatchWebhooks = async (args: {
  request: NextRequest;
  apiKeyId: string;
  userId?: string | null;
  analysisId: string;
  riskScore: number;
  payload: unknown;
}) => {
  const db = getD1();
  await dispatchAnalysisWebhooks({
    db,
    apiKeyId: args.apiKeyId,
    userId: args.userId ?? null,
    analysisId: args.analysisId,
    riskScore: args.riskScore,
    payload: args.payload,
    waitUntil: (args.request as unknown as { waitUntil?: (promise: Promise<unknown>) => void }).waitUntil
  });
};

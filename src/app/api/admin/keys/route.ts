import { NextRequest, NextResponse } from 'next/server.js';
import { createApiKeyRecord, isAdminAuthorized } from '@/lib/auth/api-key';
import { errorResponse, getDb, optionsResponse, resolveRequestId, withResponseHeaders } from '@/lib/server/phase3';

export const runtime = 'edge';

const requireAdmin = async (request: NextRequest, requestId: string) => {
  const ok = await isAdminAuthorized(request.headers.get('x-admin-token'));
  if (!ok) return errorResponse(requestId, 'UNAUTHORIZED', 'Invalid admin token', 401);
  return null;
};

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

export async function GET(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const deny = await requireAdmin(request, requestId);
  if (deny) return deny;

  const db = getDb();
  if (!db) return errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503);

  const rows = await db
    .prepare('SELECT id, name, created_at, last_used_at, revoked_at, rate_limit_per_min FROM api_keys ORDER BY created_at DESC LIMIT 200')
    .bind()
    .all<{
      id: string;
      name: string | null;
      created_at: number;
      last_used_at: number | null;
      revoked_at: number | null;
      rate_limit_per_min: number;
    }>();

  return withResponseHeaders(NextResponse.json({ keys: rows.results }), requestId);
}

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const deny = await requireAdmin(request, requestId);
  if (deny) return deny;

  const db = getDb();
  if (!db) return errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503);

  try {
    const body = (await request.json()) as { name?: string; rate_limit_per_min?: number };
    const record = await createApiKeyRecord(db, { name: body.name, rateLimitPerMin: body.rate_limit_per_min });

    return withResponseHeaders(
      NextResponse.json({
        id: record.id,
        name: record.name,
        key: record.key,
        created_at: record.created_at,
        rate_limit_per_min: record.rate_limit_per_min
      }),
      requestId
    );
  } catch {
    return errorResponse(requestId, 'KEY_CREATE_FAILED', 'Unable to create API key', 500);
  }
}

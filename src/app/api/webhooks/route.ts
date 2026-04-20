import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/auth/api-key';
import { errorResponse, getDb, optionsResponse, resolveRequestId, withResponseHeaders } from '@/lib/server/phase3';

export const runtime = 'edge';

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

const requireApiKey = async (request: NextRequest, requestId: string) => {
  const db = getDb();
  if (!db) return { error: errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503) };

  const key = request.headers.get('x-api-key');
  const apiKey = await authenticateApiKey(db, key);
  if (!apiKey) return { error: errorResponse(requestId, 'UNAUTHORIZED', 'Valid API key required', 401) };
  return { db, apiKey };
};

export async function GET(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const required = await requireApiKey(request, requestId);
  if ('error' in required) return required.error;

  const rows = await required.db
    .prepare('SELECT id, url, event_types, created_at, disabled_at FROM webhooks WHERE api_key_id = ? ORDER BY created_at DESC')
    .bind(required.apiKey.id)
    .all();

  return withResponseHeaders(NextResponse.json({ webhooks: rows.results }), requestId);
}

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const required = await requireApiKey(request, requestId);
  if ('error' in required) return required.error;

  try {
    const body = (await request.json()) as { url?: string; secret?: string; event_types?: string[] };
    if (!body.url || !/^https?:\/\//.test(body.url)) {
      return errorResponse(requestId, 'INVALID_URL', 'url must be an absolute http(s) URL', 400);
    }

    const id = crypto.randomUUID();
    const eventTypes = (body.event_types ?? ['analysis.completed']).join(',');
    await required.db
      .prepare('INSERT INTO webhooks (id, api_key_id, url, secret, event_types, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, required.apiKey.id, body.url, body.secret ?? null, eventTypes, Date.now())
      .run();

    return withResponseHeaders(NextResponse.json({ id, url: body.url, event_types: body.event_types ?? ['analysis.completed'] }), requestId);
  } catch {
    return errorResponse(requestId, 'WEBHOOK_CREATE_FAILED', 'Unable to create webhook', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = resolveRequestId(request);
  const required = await requireApiKey(request, requestId);
  if ('error' in required) return required.error;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return errorResponse(requestId, 'INVALID_REQUEST', 'id is required', 400);

  await required.db.prepare('UPDATE webhooks SET disabled_at = ? WHERE id = ? AND api_key_id = ?').bind(Date.now(), id, required.apiKey.id).run();
  return withResponseHeaders(NextResponse.json({ disabled: true, id }), requestId);
}

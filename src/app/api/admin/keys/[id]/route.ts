import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/auth/api-key';
import { getD1 } from '@/lib/db/d1';
import { errorResponse, optionsResponse, resolveRequestId, withResponseHeaders } from '@/lib/server/phase3';

export const runtime = 'edge';

export const OPTIONS = async (request: NextRequest) => optionsResponse(resolveRequestId(request));

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = resolveRequestId(request);
  const allowed = await isAdminAuthorized(request.headers.get('x-admin-token'));
  if (!allowed) return errorResponse(requestId, 'UNAUTHORIZED', 'Invalid admin token', 401);

  const db = getD1();
  if (!db) return errorResponse(requestId, 'DB_UNAVAILABLE', 'D1 is not configured', 503);

  const { id } = await context.params;
  await db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').bind(Date.now(), id).run();
  return withResponseHeaders(NextResponse.json({ revoked: true, id }), requestId);
}

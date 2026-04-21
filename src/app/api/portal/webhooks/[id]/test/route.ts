import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser, requireCsrf } from '@/lib/auth/portal';
import { signWebhookPayload } from '@/lib/webhooks/dispatch';

export const runtime = 'edge';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getD1();
  if (!db) return NextResponse.json({ error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable' } }, { status: 503 });
  if (!(await requireCsrf(request))) return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid CSRF token' } }, { status: 403 });
  const user = await getSessionUser(db, request);
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  const { id } = await params;
  const webhook = await db.prepare('SELECT id, url, secret FROM webhooks WHERE id = ? AND user_id = ? LIMIT 1').bind(id, user.id).first<{ id: string; url: string; secret: string | null }>();
  if (!webhook) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Webhook not found' } }, { status: 404 });

  const payload = JSON.stringify({ id: crypto.randomUUID(), event: 'analysis.completed', created_at: new Date().toISOString(), data: { sample: true } });
  const signature = webhook.secret ? await signWebhookPayload(webhook.secret, payload) : '';
  const response = await fetch(webhook.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-FC-Event': 'analysis.completed', ...(signature ? { 'X-FC-Signature': signature } : {}) }, body: payload });
  return NextResponse.json({ ok: response.ok, status: response.status });
}

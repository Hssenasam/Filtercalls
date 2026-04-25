import { NextRequest, NextResponse } from 'next/server.js';
import { getD1 } from '@/lib/db/d1';
import { getSessionUser } from '@/lib/auth/portal';
import { getClientIp, sha256Hex } from '@/lib/reputation/hash';
import { insertCommunityReport } from '@/lib/reputation/store';
import { sanitizeText, toLowerString } from '@/lib/reputation/sanitize';
import { REPORT_CATEGORIES, REPORT_SEVERITIES, ReportCategory, ReportSeverity } from '@/lib/reputation/types';
import { validatePhoneNumberInput } from '@/lib/phone';

export const runtime = 'edge';

const jsonError = (code: string, message: string, status: number) => NextResponse.json({ error: { code, message } }, { status });
const isCategory = (value: string): value is ReportCategory => (REPORT_CATEGORIES as readonly string[]).includes(value);
const isSeverity = (value: string): value is ReportSeverity => (REPORT_SEVERITIES as readonly string[]).includes(value);
const defaultSeverity = (category: ReportCategory): ReportSeverity => ['safe', 'business', 'delivery', 'recruiter'].includes(category) ? 'low' : 'medium';

export async function POST(request: NextRequest) {
  try {
    const db = getD1();
    if (!db) return jsonError('DB_UNAVAILABLE', 'Community reporting is temporarily unavailable.', 503);

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonError('INVALID_JSON', 'Request body must be valid JSON.', 400);

    const number = typeof body.number === 'string' ? body.number : '';
    const validation = validatePhoneNumberInput(number, 'US');
    if (validation.state !== 'valid') return jsonError('INVALID_NUMBER', validation.message ?? 'Use a complete phone number.', 400);

    const categoryValue = toLowerString(body.category);
    if (!isCategory(categoryValue)) return jsonError('INVALID_CATEGORY', 'Choose a valid report category.', 400);

    const severityValue = toLowerString(body.severity);
    const severity = isSeverity(severityValue) ? severityValue : body.quick === true ? defaultSeverity(categoryValue) : null;
    if (!severity) return jsonError('INVALID_SEVERITY', 'Choose a valid severity.', 400);

    const ip = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    const ipHash = await sha256Hex(ip);
    const userAgentHash = await sha256Hex(userAgent);
    const user = await getSessionUser(db, request).catch(() => null);

    const result = await insertCommunityReport(db, {
      normalizedNumber: validation.canonicalNumber,
      category: categoryValue,
      severity,
      comment: sanitizeText(body.comment, 280),
      sourceContext: sanitizeText(body.source_context, 80),
      reporterType: user ? 'user' : 'guest',
      reporterUserId: user?.id ?? null,
      reporterPlan: user ? 'user' : 'guest',
      ipHash,
      userAgentHash
    });

    if (!result.ok) return jsonError(result.code, result.message, result.status);
    return NextResponse.json({ success: true, message: 'Report submitted', number_hash_preview: result.numberHash.slice(0, 12) }, { status: 201 });
  } catch (error) {
    console.error('[api/reports] failed', error instanceof Error ? error.message : String(error));
    return jsonError('REPORT_FAILED', 'Unable to submit report right now.', 500);
  }
}

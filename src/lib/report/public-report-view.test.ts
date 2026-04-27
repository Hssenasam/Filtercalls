import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRecipientReportView, parsePublicReportViewMode } from './public-report-view.ts';
import type { ReputationSummary } from '@/lib/reputation/types';

const baseSummary: ReputationSummary = {
  has_community_data: true,
  total: 12,
  reputation_score: 84,
  risk_label: 'suspicious',
  top_category: 'scam',
  breakdown: { scam: 4, spam: 1, robocall: 1, telemarketing: 1, suspicious: 2, safe: 0, business: 1, delivery: 1, recruiter: 1, unknown: 0 },
  severity: { low: 2, medium: 4, high: 3, critical: 3 },
  recent_reports_24h: 5,
  activity_7d: [],
  last_reported_at: Date.now(),
  confidence: 77,
  verified_report_count: 2,
  country_code: 'US',
  number_hash_preview: '8A91'
};

test('parseViewMode supports recipient and defaults to owner', () => {
  assert.equal(parsePublicReportViewMode('recipient'), 'recipient');
  assert.equal(parsePublicReportViewMode(undefined), 'owner');
  assert.equal(parsePublicReportViewMode('other'), 'owner');
});

test('recipient model masks report preview and keeps safety guidance', () => {
  const view = buildRecipientReportView(baseSummary);
  assert.equal(view.maskedNumber, 'Report preview •••91');
  assert.equal(view.maskedNumber.includes('8A91'), false);
  assert.ok(view.doNotShare.length >= 3);
  assert.ok(view.warningBanner.length > 0);
});

test('high risk report escalates recommended action', () => {
  const view = buildRecipientReportView({ ...baseSummary, risk_label: 'high_risk' });
  assert.equal(view.warningLevel, 'critical');
  assert.match(view.recommendedAction, /Do not answer/i);
});

test('missing community data falls back to verify-first guidance', () => {
  const view = buildRecipientReportView({ ...baseSummary, has_community_data: false, total: 0, number_hash_preview: null });
  assert.equal(view.maskedNumber, 'Hidden number');
  assert.match(view.recommendedAction, /Verify/i);
});

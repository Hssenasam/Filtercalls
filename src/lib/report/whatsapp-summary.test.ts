import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWhatsAppSummary } from './whatsapp-summary.ts';
import type { AICallDecision } from '@/lib/decision';

const decision: AICallDecision = {
  primaryAction: 'block',
  riskTier: 'critical',
  confidence: 91,
  scenario: 'possible_impersonation',
  headline: 'Do not answer',
  reasons: ['Elevated risk score detected', 'Low trust score'],
  recommendedResponse: 'I do not share personal, payment, or verification information over unsolicited calls.',
  doNotShare: ['OTP codes', 'banking details', 'passwords', 'home address'],
  redFlags: ['Caller creates urgency or pressure', 'Request for one-time password or verification code'],
  safestNextStep: 'End the call immediately and verify through official channels.',
  disclaimer: 'Decision-support guidance only.'
};

test('whatsapp summary is non-empty', () => {
  assert.ok(buildWhatsAppSummary(decision, '+1 415-***-0142').length > 0);
});

test('whatsapp summary includes the masked phone number', () => {
  assert.match(buildWhatsAppSummary(decision, '+1 415-***-0142'), /\+1 415-\*\*\*-0142/);
});

test('whatsapp summary includes decision action', () => {
  assert.match(buildWhatsAppSummary(decision, '+1 415-***-0142'), /Decision: BLOCK/);
});

test('whatsapp summary includes risk tier and confidence', () => {
  const summary = buildWhatsAppSummary(decision, '+1 415-***-0142');
  assert.match(summary, /Risk tier: critical/);
  assert.match(summary, /Confidence: 91%/);
});

test('whatsapp summary stays under 900 characters for normal decisions', () => {
  assert.ok(buildWhatsAppSummary(decision, '+1 415-***-0142').length <= 900);
});

test('whatsapp summary does not require a raw phone number', () => {
  const summary = buildWhatsAppSummary(decision, '+1 415-***-0142');
  assert.match(summary, /Number: \+1 415-\*\*\*-0142/);
  assert.doesNotMatch(summary, /55550142/);
});

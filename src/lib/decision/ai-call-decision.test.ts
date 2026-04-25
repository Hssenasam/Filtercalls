import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAICallDecision } from './ai-call-decision.ts';
import type { CallDecisionPrimaryAction } from './types.ts';

const VALID_ACTIONS: CallDecisionPrimaryAction[] = ['block', 'send_to_voicemail', 'verify_first', 'answer_cautiously'];

test('critical scam decision blocks and gives safety guidance', () => {
  const decision = buildAICallDecision({
    riskScore: 90,
    trustScore: 20,
    lineType: 'voip',
    probableIntent: 'Scam / Fraud Risk',
    community: {
      total: 5,
      topCategory: 'scam',
      severity: { critical: 1 }
    }
  });

  assert.equal(decision.primaryAction, 'block');
  assert.equal(decision.riskTier, 'critical');
  assert.equal(decision.headline, 'Do not answer');
  assert.equal(decision.doNotShare.some((item) => /otp|password/i.test(item)), true);
  assert.equal(typeof decision.disclaimer, 'string');
  assert.ok(decision.disclaimer.length > 0);
});

test('high risk without community data sends caller to voicemail', () => {
  const decision = buildAICallDecision({
    riskScore: 75,
    trustScore: 30
  });

  assert.equal(decision.primaryAction, 'send_to_voicemail');
  assert.equal(decision.riskTier, 'high');
  assert.ok(decision.confidence >= 65);
});

test('delivery intent recommends verification first', () => {
  const decision = buildAICallDecision({
    riskScore: 45,
    trustScore: 55,
    probableIntent: 'Delivery / Logistics'
  });

  assert.equal(decision.primaryAction, 'verify_first');
  assert.equal(decision.scenario, 'possible_delivery_or_service');
  assert.match(decision.recommendedResponse, /order reference/i);
});

test('sales or telemarketing intent asks for safer asynchronous follow-up', () => {
  const decision = buildAICallDecision({
    riskScore: 50,
    trustScore: 45,
    probableIntent: 'Aggressive Sales Outreach',
    nuisanceLevel: 'high'
  });

  assert.equal(decision.primaryAction, 'verify_first');
  assert.equal(decision.scenario, 'possible_sales_or_telemarketing');
  assert.match(decision.recommendedResponse, /email|personal information/i);
});

test('low risk safe caller is answered cautiously', () => {
  const decision = buildAICallDecision({
    riskScore: 20,
    trustScore: 80
  });

  assert.equal(decision.primaryAction, 'answer_cautiously');
  assert.equal(decision.riskTier, 'low');
  assert.equal(decision.scenario, 'likely_safe');
});

test('same input always returns the same decision object', () => {
  const input = {
    riskScore: 62,
    trustScore: 44,
    lineType: 'unknown' as const,
    probableIntent: 'Unknown but Low-Risk' as const,
    community: {
      total: 1,
      topCategory: 'suspicious',
      severity: { medium: 1 }
    },
    signals: [{ label: 'Suspicious structure', impact: 'negative' }]
  };

  assert.deepEqual(buildAICallDecision(input), buildAICallDecision(input));
});

test('score clamping keeps extreme input safe and bounded', () => {
  const decision = buildAICallDecision({
    riskScore: 250,
    trustScore: -100
  });

  assert.ok(decision.confidence >= 0);
  assert.ok(decision.confidence <= 100);
  assert.equal(VALID_ACTIONS.includes(decision.primaryAction), true);
});

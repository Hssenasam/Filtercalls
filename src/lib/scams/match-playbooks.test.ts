import test from 'node:test';
import assert from 'node:assert/strict';
import { matchPlaybooks } from './match-playbooks.ts';
import type { AICallDecision } from '../decision/types.ts';

const baseDecision: AICallDecision = {
  primaryAction: 'verify_first',
  riskTier: 'medium',
  confidence: 70,
  scenario: 'unknown_caller',
  headline: 'Verify before responding',
  reasons: ['Caller identity needs verification'],
  recommendedResponse: 'Please confirm your details.',
  doNotShare: ['OTP'],
  redFlags: ['Urgency'],
  safestNextStep: 'Verify independently.',
  disclaimer: 'Decision-support guidance only.'
};

test('BLOCK + impersonation returns bank-otp as strong', () => {
  const matches = matchPlaybooks({
    ...baseDecision,
    primaryAction: 'block',
    riskTier: 'critical',
    scenario: 'possible_impersonation'
  });

  assert.equal(matches[0]?.slug, 'bank-otp');
  assert.equal(matches[0]?.matchStrength, 'strong');
});

test('BLOCK + financial returns crypto-investment as strong', () => {
  const matches = matchPlaybooks({
    ...baseDecision,
    primaryAction: 'block',
    riskTier: 'critical',
    scenario: 'possible_financial_scam'
  });

  assert.equal(matches[0]?.slug, 'crypto-investment');
  assert.equal(matches[0]?.matchStrength, 'strong');
});

test('VERIFY + delivery returns delivery-otp as strong', () => {
  const matches = matchPlaybooks({
    ...baseDecision,
    primaryAction: 'verify_first',
    scenario: 'possible_delivery_or_service'
  });

  assert.equal(matches[0]?.slug, 'delivery-otp');
  assert.equal(matches[0]?.matchStrength, 'strong');
});

test('ALLOW-like decision returns no matches', () => {
  const matches = matchPlaybooks({
    ...baseDecision,
    primaryAction: 'answer_cautiously',
    scenario: 'likely_safe',
    riskTier: 'low'
  });

  assert.deepEqual(matches, []);
});

test('unknown scenarios return no matches', () => {
  const matches = matchPlaybooks({
    ...baseDecision,
    primaryAction: 'send_to_voicemail',
    scenario: 'unknown_caller'
  });

  assert.deepEqual(matches, []);
});

test('never returns more than two results', () => {
  const matches = matchPlaybooks({
    ...baseDecision,
    primaryAction: 'block',
    scenario: 'possible_impersonation',
    riskTier: 'critical'
  });

  assert.ok(matches.length <= 2);
});

test("matchStrength is always 'strong' or 'possible'", () => {
  const candidateDecisions: AICallDecision[] = [
    { ...baseDecision, primaryAction: 'block', scenario: 'possible_impersonation', riskTier: 'critical' },
    { ...baseDecision, primaryAction: 'block', scenario: 'possible_financial_scam', riskTier: 'high' },
    { ...baseDecision, primaryAction: 'verify_first', scenario: 'possible_delivery_or_service' },
    { ...baseDecision, primaryAction: 'verify_first', scenario: 'possible_robocall' }
  ];

  for (const decision of candidateDecisions) {
    for (const match of matchPlaybooks(decision)) {
      assert.ok(match.matchStrength === 'strong' || match.matchStrength === 'possible');
    }
  }
});

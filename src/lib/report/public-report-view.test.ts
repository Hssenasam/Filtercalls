import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseViewMode,
  recipientDoNotShare,
  recipientHeadline,
  recipientSafeResponse,
  recipientSteps,
  recommendedPlaybookSlug
} from './public-report-view.ts';

test('parseViewMode supports recipient and defaults to owner', () => {
  assert.equal(parseViewMode('recipient'), 'recipient');
  assert.equal(parseViewMode('owner'), 'owner');
  assert.equal(parseViewMode(undefined), 'owner');
});

test('recipient headline escalates for high risk', () => {
  assert.match(recipientHeadline('high_risk', true), /Warning/i);
  assert.match(recipientHeadline('suspicious', true), /Caution/i);
});

test('recipient steps always return four concise items', () => {
  assert.equal(recipientSteps('high_risk').length, 4);
  assert.equal(recipientSteps('watch').length, 4);
});

test('safe response is non-empty and deterministic', () => {
  const message = recipientSafeResponse('high_risk');
  assert.ok(message.length > 20);
  assert.equal(message, recipientSafeResponse('high_risk'));
});

test('do-not-share list is present', () => {
  const list = recipientDoNotShare();
  assert.ok(list.length >= 4);
});

test('recommended playbook uses summary signals', () => {
  const base = {
    has_community_data: true,
    total: 2,
    risk_label: 'high_risk',
    top_category: 'scam'
  };

  assert.equal(recommendedPlaybookSlug(base as unknown as Parameters<typeof recommendedPlaybookSlug>[0]), 'bank-otp');
  assert.equal(
    recommendedPlaybookSlug({ ...base, top_category: 'delivery', risk_label: 'watch' } as unknown as Parameters<typeof recommendedPlaybookSlug>[0]),
    'delivery-otp'
  );
});

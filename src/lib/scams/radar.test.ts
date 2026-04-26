import test from 'node:test';
import assert from 'node:assert/strict';
import { getHighestRiskPatterns, getPressureTactics, getRadarPatterns } from './radar.ts';
import { scamPatterns } from './patterns.ts';

const riskOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

test('getRadarPatterns returns all scam patterns', () => {
  const patterns = getRadarPatterns();
  assert.equal(patterns.length, scamPatterns.length);
});

test('getHighestRiskPatterns returns sorted patterns by severity', () => {
  const patterns = getHighestRiskPatterns(6);
  for (let index = 1; index < patterns.length; index += 1) {
    assert.ok(riskOrder[patterns[index - 1].riskTier] <= riskOrder[patterns[index].riskTier]);
  }
});

test('getPressureTactics returns at least five tactics', () => {
  const tactics = getPressureTactics();
  assert.ok(tactics.length >= 5);
});

test('each pressure tactic has a warning phrase', () => {
  for (const tactic of getPressureTactics()) {
    assert.ok(tactic.warningPhrase.trim().length > 0);
  }
});

test('pressure tactic playbooks are valid slugs', () => {
  const validSlugs = new Set(scamPatterns.map((pattern) => pattern.slug));
  for (const tactic of getPressureTactics()) {
    for (const slug of tactic.matchedPlaybooks) {
      assert.equal(validSlugs.has(slug), true);
    }
  }
});

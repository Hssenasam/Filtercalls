import test from 'node:test';
import assert from 'node:assert/strict';
import { getScamDetailSchema, getScamsCollectionSchema } from './schema.ts';

test('getScamsCollectionSchema returns valid JSON', () => {
  const value = getScamsCollectionSchema();
  const parsed = JSON.parse(value) as { ['@graph']: Array<{ ['@type']: string }> };
  assert.ok(Array.isArray(parsed['@graph']));
});

test('getScamDetailSchema returns valid JSON', () => {
  const value = getScamDetailSchema('bank-otp');
  const parsed = JSON.parse(value) as { ['@graph']: Array<{ ['@type']: string }> };
  assert.ok(Array.isArray(parsed['@graph']));
});

test('collection schema includes CollectionPage', () => {
  const parsed = JSON.parse(getScamsCollectionSchema()) as { ['@graph']: Array<{ ['@type']: string }> };
  assert.equal(parsed['@graph'].some((item) => item['@type'] === 'CollectionPage'), true);
});

test('detail schema includes HowTo', () => {
  const parsed = JSON.parse(getScamDetailSchema('bank-otp')) as { ['@graph']: Array<{ ['@type']: string }> };
  assert.equal(parsed['@graph'].some((item) => item['@type'] === 'HowTo'), true);
});

test('detail schema includes SpeakableSpecification', () => {
  const parsed = JSON.parse(getScamDetailSchema('bank-otp')) as {
    ['@graph']: Array<{ ['@type']: string; speakable?: { ['@type']?: string } }>;
  };
  assert.equal(parsed['@graph'].some((item) => item.speakable?.['@type'] === 'SpeakableSpecification'), true);
});

test('detail schema article includes lastReviewed', () => {
  const parsed = JSON.parse(getScamDetailSchema('bank-otp')) as {
    ['@graph']: Array<{ ['@type']: string; lastReviewed?: string }>;
  };
  const article = parsed['@graph'].find((item) => item['@type'] === 'Article');
  assert.equal(typeof article?.lastReviewed, 'string');
});

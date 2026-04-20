import assert from 'node:assert/strict';
import test from 'node:test';
import { corsHeaders, resolveRequestIdFromHeaders } from './phase3-core.ts';

test('CORS headers include API key and request-id headers', () => {
  assert.equal(corsHeaders['Access-Control-Allow-Origin'], '*');
  assert.match(corsHeaders['Access-Control-Allow-Headers'], /X-API-Key/);
  assert.match(corsHeaders['Access-Control-Allow-Headers'], /X-Request-ID/);
});

test('request id honors caller provided id', () => {
  assert.equal(resolveRequestIdFromHeaders(new Headers({ 'x-request-id': 'req-123' })), 'req-123');
});

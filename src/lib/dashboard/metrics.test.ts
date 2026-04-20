import test from 'node:test';
import assert from 'node:assert/strict';
import { maskE164 } from '../db/d1.ts';
import { loadDashboardMetrics } from './metrics.ts';
import type { D1DatabaseLike } from '../db/d1.ts';

test('masking keeps prefix and last two digits', () => {
  assert.equal(maskE164('+14155550142').startsWith('+1'), true);
  assert.equal(maskE164('+14155550142').endsWith('42'), true);
  assert.equal(maskE164('+14155550142').includes('5550'), false);
});

test('dashboard loader returns seeded data', async () => {
  const db: D1DatabaseLike = {
    prepare(query: string) {
      return {
        bind: () => ({
          async first() {
            if (query.includes('COUNT(*) as total')) return { total: 3, avg_risk: 70, high_count: 2 };
            return null;
          },
          async all() {
            if (query.includes('GROUP BY')) return { results: [{ country: 'US', count: 2 }] };
            return {
              results: [
                { id: '1', e164: '+14155550142', country: 'US', risk_score: 82, risk_level: 'high', created_at: Date.now() }
              ]
            };
          },
          async run() {
            return {};
          }
        })
      };
    }
  };

  const out = await loadDashboardMetrics(db);
  assert.equal(out.windows[0].total, 3);
  assert.equal(out.topCountries[0].country, 'US');
  assert.equal(out.recent[0].masked_number.endsWith('42'), true);
});

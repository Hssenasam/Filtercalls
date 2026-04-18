# FilterCalls — Test Cases (v2)

> 35 deterministic test cases. Use as Vitest snapshots in `tests/snapshots.spec.ts`.
> Engine version expected: `2.0.0`.

Notation:
- **Input:** raw user input + selected country (ISO2 or `null`).
- **Expect:** key invariants. Exact `risk` may shift ±5 across engine tunings; **tier** and **intent family** must match.

---

## A) Country detection (Phase 1, B3 fixes)

| # | Input                          | Country sel. | Expect                                                  |
|---|--------------------------------|--------------|---------------------------------------------------------|
| 1 | `+14165550123`                 | null         | country=`CA`, line_type∈{FIXED_LINE,MOBILE}             |
| 2 | `+12015550100`                 | null         | country=`US`                                            |
| 3 | `4165550123`                   | `CA`         | e164=`+14165550123`, country=`CA`                       |
| 4 | `2015550100`                   | `US`         | e164=`+12015550100`, country=`US`                       |
| 5 | `2015550100`                   | null         | **400 COUNTRY_REQUIRED**                                |
| 6 | `+447911123456`                | null         | country=`GB`, line_type=`MOBILE`                        |
| 7 | `+8613800138000`               | null         | country=`CN`, line_type=`MOBILE`                        |
| 8 | `+971501234567`                | null         | country=`AE`                                            |
| 9 | `abc123`                       | `US`         | **400 INVALID_NUMBER**                                  |
|10 | `+1` (too short)               | null         | **400 INVALID_NUMBER**                                  |

---

## B) Sequential variance (Phase 1, B1 fix)

Run all ten and assert `max(risk) - min(risk) >= 6`.

| # | Input            | Country |
|---|------------------|---------|
|11 | `+12015550100`   | null    |
|12 | `+12015550101`   | null    |
|13 | `+12015550102`   | null    |
|14 | `+12015550103`   | null    |
|15 | `+12015550104`   | null    |
|16 | `+12015550105`   | null    |
|17 | `+12015550106`   | null    |
|18 | `+12015550107`   | null    |
|19 | `+12015550108`   | null    |
|20 | `+12015550109`   | null    |

Determinism check: run #11 three times → identical `risk`, `trust`, `confidence`, `intent`.

---

## C) Intent ↔ risk coherence (Phase 1, B2 fix)

| # | Input           | Country | Expect                                                                        |
|---|-----------------|---------|-------------------------------------------------------------------------------|
|21 | `+18005551212`  | null    | line_type=`TOLL_FREE`, intent ∈ family {Toll-Free / Marketing / Mass Outreach}|
|22 | `+19005550123`  | null    | line_type=`PREMIUM_RATE`, tier ≥ HIGH, intent contains "Premium" or "Trap"    |
|23 | `+12125555555`  | null    | structure flagged (uniform digits), tier ≥ ELEVATED                           |
|24 | `+11111111111`  | null    | **400 INVALID_NUMBER** (not a real number)                                    |
|25 | `+12015551234`  | null    | ascending run flagged, tier ≥ ELEVATED                                        |

**Invariant test (property-based, 1000 iters):**
For any input that produces `risk_score >= 70`, the `intent` field MUST NOT be one of:
`["Likely Safe", "Unknown but Low-Risk", "Verified Clean", "Clean Pattern"]`.

For any input that produces `risk_score <= 19`, the `intent` field MUST NOT be one of:
`["Confirmed Scam / Fraud", "Likely Scam", "Active Mass-Dialer", "Synthetic / Burner Number"]`.

---

## D) Engine v2 layered output (Phase 2)

| # | Input            | Expect                                                              |
|---|------------------|---------------------------------------------------------------------|
|26 | `+12015550100`   | response has `layers[]` with 4 entries, sum of confidences > 1.0    |
|27 | `+12015550100`   | header `x-fc-cache: MISS` on first call, `HIT` on second            |
|28 | `+12015550100?fresh=1` | header `x-fc-cache: BYPASS`                                   |
|29 | provider timeout simulated | reputation layer confidence=0, response still 200         |
|30 | `engine_version` field      | === `"2.0.0"`                                            |

---

## E) Bulk endpoint (Phase 3)

| # | Input                                      | Expect                                                  |
|---|--------------------------------------------|---------------------------------------------------------|
|31 | `POST /api/analyze/batch` with 100 numbers | 200, `results.length === 100`, order preserved          |
|32 | batch with 101 numbers                     | **400 BATCH_TOO_LARGE**                                 |
|33 | batch with 1 invalid + 4 valid             | results array contains `{error: "INVALID_NUMBER"}` slot |

---

## F) API keys & webhooks (Phase 3)

| # | Scenario                                                  | Expect                                              |
|---|-----------------------------------------------------------|-----------------------------------------------------|
|34 | Request without `Authorization` header to `/api/analyze`  | **401 UNAUTHORIZED** (except `/api/analyze/demo`)   |
|35 | Analysis with `risk >= 80` and webhook configured         | webhook POST received within 5s, signature verifies |

---

## Snapshot template

```ts
// tests/snapshots.spec.ts
import { describe, it, expect } from 'vitest';
import { analyze } from '@/lib/engine';

const CASES = [
  { id: 1,  input: '+14165550123', country: null, expect: { country: 'CA' } },
  { id: 2,  input: '+12015550100', country: null, expect: { country: 'US' } },
  // …
];

describe('FilterCalls v2 snapshots', () => {
  for (const c of CASES) {
    it(`#${c.id} ${c.input}`, async () => {
      const out = await analyze(c.input, c.country);
      for (const [k, v] of Object.entries(c.expect)) {
        expect((out as any)[k]).toBe(v);
      }
    });
  }

  it('sequential variance >= 6 pts', async () => {
    const scores: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = await analyze(`+1201555010${i}`, null);
      scores.push(r.risk_score);
    }
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(6);
  });

  it('determinism', async () => {
    const a = await analyze('+12015550100', null);
    const b = await analyze('+12015550100', null);
    expect(a).toEqual(b);
  });

  it('high risk never labeled safe', async () => {
    // Property test: feed 1000 pseudo-random valid numbers
    for (let i = 0; i < 1000; i++) {
      const num = `+1201555${String(1000 + i).padStart(4, '0')}`;
      const r = await analyze(num, null);
      if (r.risk_score >= 70) {
        expect(r.intent).not.toMatch(/Safe|Unknown but Low|Verified Clean/i);
      }
    }
  });
});
```

End of test cases.

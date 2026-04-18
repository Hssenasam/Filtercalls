# FilterCalls — Architecture v2 (Reference)

> Companion to `filtercalls-codex-prompt.md`. Use as the source of truth for the new engine.

---

## 1) System diagram

```
                ┌─────────────────────────────────────────────────────┐
                │                  Next.js 15 (Edge)                  │
                │                                                     │
   client ────► │  /api/analyze         /api/analyze/batch            │
                │  /api/keys            /api/webhooks                 │
                │  /dashboard           /docs                         │
                └──────────┬───────────────────────────┬──────────────┘
                           │                           │
                           ▼                           ▼
              ┌───────────────────────┐     ┌──────────────────────┐
              │  Auth & Rate Limit    │     │  Engine Orchestrator │
              │  (D1 keys + KV ctr)   │     │  lib/engine/index.ts │
              └──────────┬────────────┘     └──────────┬───────────┘
                         │                              │
                         │           ┌──────────────────┼─────────────────────┐
                         │           ▼                  ▼                     ▼
                         │   ┌──────────────┐   ┌──────────────┐    ┌──────────────────┐
                         │   │ L1 Structure │   │ L2 Geography │    │ L3 Reputation    │
                         │   │  (digit sigs)│   │ libphone+map │    │  provider chain  │
                         │   └──────┬───────┘   └──────┬───────┘    └────────┬─────────┘
                         │          │                  │                     │
                         │          │                  │                     ▼
                         │          │                  │            ┌──────────────────┐
                         │          │                  │            │  KV cache 24h    │
                         │          │                  │            └──────────────────┘
                         │          ▼                  ▼                     ▼
                         │   ┌──────────────────────────────────────────────────────┐
                         │   │   Bayesian aggregator (log-odds, weighted)           │
                         │   └────────────────────────┬─────────────────────────────┘
                         │                            ▼
                         │                  ┌──────────────────┐
                         │                  │  Intent Matrix   │
                         │                  └────────┬─────────┘
                         │                           ▼
                         │                  Final Response (v2)
                         ▼                           │
                ┌──────────────────┐                 │
                │  D1 history      │ ◄───────────────┘
                │  Webhook queue   │
                └──────────────────┘
```

---

## 2) Layer contracts

```ts
interface LayerResult {
  name: 'structure' | 'geography' | 'reputation' | 'behavioral';
  risk: number;          // 0..100
  trust: number;         // 0..100  (often 100-risk; not always — geography can have both low risk AND low trust)
  confidence: number;    // 0..1    (how much THIS layer trusts itself)
  evidence: string[];    // human-readable reasons
  source?: string;       // for reputation: which provider answered
  latencyMs: number;
}
```

### Layer 1 — Structure (deterministic, always confidence=1.0)
Inputs: national digit string.
Signals (each 0..10):
- `digitEntropy` — Shannon entropy over digit frequencies. Lower = more suspicious.
- `positionalRepetition` — counts `aabb`, `abab`, `aaaa` patterns.
- `ascendingRunLength` — longest `1234…` or `9876…` run.
- `blockUniformity` — total chars in same-digit blocks of length ≥3.
- `prefixBlockSuspicion` — known burner prefixes (e.g. NANP `555-01xx`).
- `lengthAnomaly` — distance from typical length for the country.

Risk = clamp( w·signals + jitter ), with **per-position weighted hash** (`digitFingerprint`) so that flipping one digit reliably moves the score 4–10 pts.

### Layer 2 — Geography
Uses `libphonenumber-js`:
- `parsed.country`, `parsed.getType()` (MOBILE / FIXED_LINE / VOIP / TOLL_FREE / PREMIUM_RATE)
- Look up region risk from `data/region-risk.ts` (50 entries, 0..100).
- VOIP / PREMIUM_RATE add +25 risk; verified MOBILE in low-risk region subtracts 15.

### Layer 3 — Reputation (provider chain)
```
PROVIDER_ORDER (env) → [twilio, numverify, abstract, internal]
```
- Stop on first `ok`.
- Each provider call wrapped in `Promise.race([call, timeout(2500)])`.
- Result cached in KV `lookup:{provider}:{e164}` for 24h.
- Confidence: twilio=0.9, numverify=0.7, abstract=0.6, internal=0.3.

### Layer 4 — Behavioral
KV counter `seen:{e164}` incremented on every analysis, TTL 7 days.
- Score increases with frequency in short windows (>10/hour → +20 risk).
- If KV empty → confidence 0 (neutral, doesn't influence aggregate).

---

## 3) Aggregator — Bayesian log-odds

```ts
function aggregate(layers: LayerResult[]) {
  // 1. Convert each risk to log-odds, weight by confidence
  let logOdds = 0;
  let totalWeight = 0;
  for (const l of layers) {
    if (l.confidence <= 0) continue;
    const p = Math.min(0.999, Math.max(0.001, l.risk / 100));
    const lo = Math.log(p / (1 - p));
    const w = l.confidence * LAYER_WEIGHT[l.name];
    logOdds += lo * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return { risk: 50, confidence: 0 };

  const avgLogOdds = logOdds / totalWeight;
  const p = 1 / (1 + Math.exp(-avgLogOdds));
  const risk = Math.round(p * 100);

  // 2. Confidence = probabilistic OR  (1 - Π(1 - cᵢ))
  const confidence = 1 - layers.reduce((acc, l) => acc * (1 - l.confidence), 1);

  return { risk, trust: 100 - risk, confidence: +confidence.toFixed(2) };
}

const LAYER_WEIGHT = {
  structure:  1.0,
  geography:  1.2,
  reputation: 1.8,   // most trusted when present
  behavioral: 0.8,
};
```

---

## 4) Intent Decision Matrix

Tier is derived ONLY from final aggregated risk:

| Risk     | Tier      |
|----------|-----------|
| 85–100   | CRITICAL  |
| 70–84    | HIGH      |
| 55–69    | ELEVATED  |
| 40–54    | MODERATE  |
| 20–39    | LOW       |
| 0–19     | CLEAN     |

Intent label is then refined by the **dominant signal** (highest-confidence layer):

| Tier      | Dominant = Reputation     | Dominant = Geography           | Dominant = Structure           | Dominant = Behavioral         |
|-----------|---------------------------|--------------------------------|--------------------------------|-------------------------------|
| CRITICAL  | Confirmed Scam / Fraud    | Premium-Rate Trap              | Synthetic / Burner Number      | Active Mass-Dialer            |
| HIGH      | Likely Scam               | Suspicious VOIP Origin         | Likely Synthetic               | Likely Mass Outreach          |
| ELEVATED  | Reported Spam             | Risky Region                   | Structurally Suspicious        | High-Frequency Caller         |
| MODERATE  | Mixed Reputation          | Long-Distance Marketing        | Mildly Anomalous Pattern       | Frequent but Plausible        |
| LOW       | Mostly Clean              | Standard Domestic              | Normal Pattern                 | Normal Activity               |
| CLEAN     | Verified Clean            | Verified Domestic Mobile       | Clean Pattern                  | Rarely Seen                   |

**INVARIANTS (enforced by tests):**
1. `risk >= 70` ⇒ intent ∉ {Likely Safe, Unknown but Low-Risk, Verified Clean}.
2. `risk <= 19` ⇒ intent ∉ {Confirmed Scam, Likely Scam, Active Mass-Dialer}.
3. Same input ⇒ same `(risk, trust, confidence, intent)` byte-for-byte.

---

## 5) Response shape v2 (additive)

```jsonc
{
  "phone": "+12015550100",
  "country": "US",
  "line_type": "FIXED_LINE",
  "risk_score": 73,
  "trust_score": 27,
  "confidence": 0.81,
  "intent": "Likely Mass Outreach",
  "intent_tier": "HIGH",
  "layers": [ /* LayerResult[] */ ],
  "engine_version": "2.0.0",
  "cached": false,
  "request_id": "req_01HX…"
}
```

Response headers:
```
x-fc-cache: HIT | MISS | BYPASS
x-fc-engine: 2.0.0
x-fc-latency-ms: 412
```

---

## 6) Storage layout

| Store              | Purpose                              | TTL         |
|--------------------|--------------------------------------|-------------|
| KV `CACHE_LOOKUPS` | Provider responses                   | 24 h        |
| KV `RATE`          | per-key minute counters              | 60 s        |
| KV `SEEN`          | behavioral frequency                 | 7 d         |
| D1 `analyses`      | full history                         | persistent  |
| D1 `api_keys`      | hashed keys + quota                  | persistent  |
| D1 `webhooks`      | endpoints + secrets                  | persistent  |

---

## 7) Failure modes & defaults

| Failure                       | Behavior                                            |
|-------------------------------|-----------------------------------------------------|
| All providers timeout         | Reputation layer skipped; aggregate confidence drops; response still 200. |
| `libphonenumber` invalid      | 400 `INVALID_NUMBER`. No engine call.               |
| No country & no `+` prefix    | 400 `COUNTRY_REQUIRED`.                             |
| KV unavailable                | Behavioral layer confidence=0; cache disabled.      |
| D1 unavailable                | History write skipped (logged); response unaffected. |
| Webhook delivery fails        | Retry 3× with exponential backoff (1s, 5s, 30s).    |

---

End of architecture reference.

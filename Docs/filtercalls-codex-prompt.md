# FilterCalls — Codex Implementation Prompt

> **For: OpenAI Codex / GitHub Copilot Workspace / any code-gen agent**
> **Repo:** `Hssenasam/Filtercalls` (branch: `main`)
> **Stack:** Next.js 15 (App Router) · TypeScript · Cloudflare Pages (Edge runtime) · Tailwind v4
> **Goal:** Take FilterCalls from a working prototype to a production-grade *Call Intent Intelligence Platform*.

Execute the work in **three sequential phases**. Open one PR per phase. Do **not** combine phases.

---

## 🔧 GLOBAL CONVENTIONS (apply to every phase)

1. **Edge runtime everywhere.** Every `app/api/**/route.ts` must export `export const runtime = 'edge'`.
2. **No Node-only deps.** Allowed: `libphonenumber-js`, `zod`, `@cloudflare/workers-types`. Forbidden: `node:fs`, `node:child_process`, `sharp`, `puppeteer`.
3. **TypeScript strict.** No `any`, no `// @ts-ignore`. Use `unknown` + zod parsing at boundaries.
4. **Deterministic engine.** Same input → same output. Never call `Date.now()` or `Math.random()` inside scoring.
5. **Backwards-compatible API.** `POST /api/analyze` response shape MUST keep existing keys; only ADD fields.
6. **Tests required.** Every change ships with Vitest unit tests. Phase passes only if `pnpm test` is green.
7. **Commit style:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

---

# PHASE 1 — CRITICAL FIXES (must ship first)

### Context
Three blocking bugs are confirmed in production:
- **B1:** Sequential numbers (e.g. `+12015550100` vs `+12015550101`) produce nearly identical `risk_score` (±1).
- **B2:** Cases with `risk_score >= 85` are still labeled `"Unknown but Low-Risk"` — internally inconsistent.
- **B3:** Country detection is broken. `lib/countries.ts` lists ~400 hardcoded US area-codes (`1201`, `1202`, …) which collide with Canada (`1`) in `SORTED_DIAL_CODES`. Also `normalizePhone` defaults to `+1` when no country is selected.

### Tasks

#### 1.1 — Replace dial-code logic with `libphonenumber-js`
- `pnpm add libphonenumber-js`
- Edit `lib/countries.ts`:
  - Keep the `Country` type and the human-readable list (name, ISO2, flag emoji), **but remove the hand-rolled `dialCodes` arrays** and the `SORTED_DIAL_CODES` export.
  - Export only `COUNTRIES: Country[]` and a helper `getCountryByIso2(iso2: string)`.
- Rewrite `lib/phone-provider.ts` `normalizePhone(input, selectedCountry?)`:
  ```ts
  import { parsePhoneNumberFromString, getCountryCallingCode } from 'libphonenumber-js';

  export function normalizePhone(raw: string, selectedCountryIso2?: string) {
    const parsed = parsePhoneNumberFromString(raw, selectedCountryIso2 as any);
    if (!parsed || !parsed.isValid()) {
      return { ok: false as const, error: 'INVALID_NUMBER' };
    }
    return {
      ok: true as const,
      e164: parsed.number,                  // "+12015550100"
      national: parsed.nationalNumber,      // "2015550100"
      countryIso2: parsed.country ?? null,  // "US" | "CA" | ...
      countryCode: parsed.countryCallingCode,
      type: parsed.getType() ?? 'UNKNOWN',  // MOBILE | FIXED_LINE | VOIP | ...
    };
  }
  ```
- **Remove** the implicit `+1` default. If `selectedCountryIso2` is absent AND the number has no `+`, return `{ ok: false, error: 'COUNTRY_REQUIRED' }`.
- The API route `app/api/analyze/route.ts` must surface `COUNTRY_REQUIRED` and `INVALID_NUMBER` as `400` responses with JSON `{ error: { code, message } }`.

#### 1.2 — Fix engine determinism & sequential variance (`lib/hash.ts` + `lib/intent-engine.ts`)

In `lib/hash.ts`:
- Add a new helper `digitFingerprint(national: string): number` that returns a 32-bit value computed as a **weighted positional sum**, NOT `fnv1a32(string)`:
  ```ts
  export function digitFingerprint(national: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < national.length; i++) {
      const d = national.charCodeAt(i) - 48;
      // position-sensitive mix: every digit shifts the state differently
      h ^= (d * 0x9E3779B1) ^ (i * 0x85EBCA77);
      h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
      h = (h + Math.imul(d + 1, i * 31 + 7)) >>> 0;
    }
    return h >>> 0;
  }
  ```
- Replace `boundedJitter(seed, min, max)` body so the span is a **percentage of the score**, not a fixed `% 13`:
  ```ts
  export function boundedJitter(seed: number, base: number, spreadPct = 0.18): number {
    const span = Math.max(4, Math.round(base * spreadPct));        // ≥4 pts
    const offset = (digitFingerprint(String(seed)) % (span * 2)) - span;
    return Math.max(0, Math.min(100, base + offset));
  }
  ```

In `lib/intent-engine.ts`:
- Inside `extractSignals`, add 4 new **digit-sensitive** signals:
  ```ts
  digitEntropy:        // 0..10 — Shannon entropy over digit frequency
  positionalRepetition // 0..10 — count of "abab" / "aabb" patterns
  ascendingRunLength   // 0..10 — longest ascending sequence (1234)
  blockUniformity      // 0..10 — same-digit blocks ("000", "111")
  ```
  These must change between `2015550100` and `2015550101`. Weight them in the structural score.

- Rewrite `classifyIntent` as a **deterministic decision matrix** (no orphan branches):
  ```ts
  type Tier = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW' | 'CLEAN';

  function tier(risk: number): Tier {
    if (risk >= 85) return 'CRITICAL';
    if (risk >= 70) return 'HIGH';
    if (risk >= 55) return 'ELEVATED';
    if (risk >= 40) return 'MODERATE';
    if (risk >= 20) return 'LOW';
    return 'CLEAN';
  }

  // Map (tier, dominantSignal) -> intent. NO tier above ELEVATED can return
  // "Likely Safe" or "Unknown but Low-Risk". Verified by unit test.
  ```
  Provide the full matrix; export `INTENT_MATRIX` so tests can iterate it.

- **Invariant test (mandatory):** `for risk in 0..100, classifyIntent(...).intent` is consistent with `tier(risk)`. Specifically: if `risk >= 70`, intent label MUST be in the “risky” set.

#### 1.3 — Tests
Create `tests/engine.spec.ts` with at minimum:
- `sequential numbers produce different scores` (assert spread ≥ 6 pts across 10 consecutive numbers)
- `risk>=70 never yields a safe intent` (1000-iter property test)
- `Canadian numbers are detected as CA, not US`
- `+12015550100 is detected as US`
- `missing country with no leading + returns COUNTRY_REQUIRED`
- snapshot the response for 12 fixed numbers (see `filtercalls-test-cases.md`)

### Phase 1 Acceptance Criteria
- ✅ `pnpm typecheck && pnpm lint && pnpm test` all pass.
- ✅ Sequential test shows ≥6-point spread across `+1201555010{0..9}`.
- ✅ No response can have `risk_score >= 70` AND `intent ∈ {Likely Safe, Unknown but Low-Risk}`.
- ✅ `+14165550123` (Toronto) returns `country: "CA"`.
- ✅ `lib/countries.ts` no longer contains hardcoded area codes.
- ✅ Bundle size for the analyze route increases by < 200 KB.

---

# PHASE 2 — INTELLIGENCE ENGINE v2 + HYBRID PROVIDERS

### Goal
Move from a single linear formula to a **multi-layer scoring pipeline** with **external reputation providers** and **edge-side caching**.

### Architecture
```
            ┌────────────────────────────────────────┐
 input ───► │ Layer 1: Structure (digit signals)     │
            │ Layer 2: Geography (libphonenumber)    │
            │ Layer 3: Reputation (provider chain)   │
            │ Layer 4: Behavioral  (KV history)      │
            └──────────────┬─────────────────────────┘
                           ▼
              Bayesian-weighted aggregator
                           ▼
          { risk, trust, confidence, intent, layers[] }
```

### Tasks

#### 2.1 — Layered scoring
Create `lib/engine/` with these files:
- `layer-structure.ts` — owns the digit signals from Phase 1.
- `layer-geography.ts` — uses `libphonenumber-js` metadata + a small carrier/region risk map (`data/region-risk.ts`, ~50 entries).
- `layer-reputation.ts` — talks to providers (see 2.2).
- `layer-behavioral.ts` — pulls last-seen counts from Cloudflare KV (`KV_HISTORY`). If KV is empty, return neutral.
- `aggregator.ts` — combines layer outputs:
  ```ts
  // Each layer returns { risk: 0-100, trust: 0-100, confidence: 0-1, evidence: string[] }
  // Final risk = weighted log-odds combination.
  // Final confidence = 1 - Π(1 - layer.confidence)   // probabilistic OR
  ```
- `index.ts` — orchestrates layers in parallel via `Promise.allSettled`; never let one provider failure tank the response.

#### 2.2 — Provider chain
Create `lib/providers/` with one file per provider:
- `numverify.ts` — APILayer NumVerify (already partially wired).
- `twilio-lookup.ts` — Twilio Lookup v2 with `Fields=line_type_intelligence,caller_name`.
- `abstract.ts` — AbstractAPI Phone Validation (fallback).
- `internal.ts` — pure-engine fallback that always succeeds.
- `chain.ts` — runs in declared order, stops on first `ok` result, attaches `source` to evidence. Each provider has:
  ```ts
  interface PhoneProvider {
    name: string;
    enabled(): boolean;        // checks env var presence
    lookup(e164: string): Promise<ProviderResult>;
  }
  ```

#### 2.3 — KV caching
- Bind `CACHE_LOOKUPS` namespace in `wrangler.toml`.
- Wrap each provider call: cache key = `lookup:${provider}:${e164}`, TTL = 24h.
- Add a `?fresh=1` query param to bypass cache (admin only — gated by API key in Phase 3).

#### 2.4 — Env vars
Update `.env.example`:
```
NUMVERIFY_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
ABSTRACT_API_KEY=
PROVIDER_ORDER=twilio,numverify,abstract,internal
```
The chain reads `PROVIDER_ORDER` to allow ops to reorder without code changes.

#### 2.5 — Response shape (additive only)
```jsonc
{
  "phone": "+12015550100",
  "country": "US",
  "risk_score": 73,
  "trust_score": 22,
  "confidence": 0.81,
  "intent": "Likely Mass Outreach",
  "intent_tier": "HIGH",
  "layers": [
    { "name": "structure",  "risk": 64, "confidence": 1.0, "evidence": ["repeating block 555"] },
    { "name": "geography",  "risk": 30, "confidence": 0.9, "evidence": ["NJ landline"] },
    { "name": "reputation", "risk": 88, "confidence": 0.7, "evidence": ["twilio:line_type=voip"], "source": "twilio" },
    { "name": "behavioral", "risk": 40, "confidence": 0.4, "evidence": ["seen 3x in 24h"] }
  ],
  "engine_version": "2.0.0"
}
```

### Phase 2 Acceptance Criteria
- ✅ All four layers run in parallel; total p95 latency < 800 ms with two providers enabled.
- ✅ A provider timeout (>2.5s) is treated as `confidence: 0` and never throws.
- ✅ Cache hit ratio observable via response header `x-fc-cache: HIT|MISS|BYPASS`.
- ✅ `engine_version` bumped to `2.0.0`.
- ✅ 80%+ test coverage on `lib/engine/**`.

---

# PHASE 3 — PRODUCT FEATURES

### 3.1 — Cloudflare D1 for history & analytics
- `wrangler d1 create filtercalls_db`
- Migration `migrations/0001_init.sql`:
  ```sql
  CREATE TABLE analyses (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    api_key_id TEXT,
    e164 TEXT NOT NULL,
    country TEXT,
    risk INTEGER NOT NULL,
    trust INTEGER NOT NULL,
    confidence REAL NOT NULL,
    intent TEXT NOT NULL,
    engine_version TEXT NOT NULL,
    raw_json TEXT NOT NULL
  );
  CREATE INDEX idx_analyses_apikey_time ON analyses(api_key_id, created_at DESC);
  CREATE INDEX idx_analyses_e164 ON analyses(e164);

  CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    hashed_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    monthly_quota INTEGER NOT NULL DEFAULT 1000,
    revoked_at INTEGER
  );

  CREATE TABLE webhooks (
    id TEXT PRIMARY KEY,
    api_key_id TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    min_risk INTEGER NOT NULL DEFAULT 80,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(api_key_id) REFERENCES api_keys(id)
  );
  ```

### 3.2 — API keys + rate limiting
- New routes:
  - `POST /api/keys` (admin token gated) — creates a key, returns plaintext **once**.
  - `DELETE /api/keys/:id` — revokes.
- Middleware: extract `Authorization: Bearer fc_live_…`, hash with SHA-256, look up in D1.
- Rate limit per key via Cloudflare KV counter: 60 req/min, monthly quota enforced.

### 3.3 — Bulk analysis
- `POST /api/analyze/batch` body `{ numbers: string[], country?: string }` (max 100).
- Run via `Promise.all`, share KV cache, return array preserving input order.
- Response includes `summary: { total, critical, high, errors }`.

### 3.4 — Webhooks
- After every analysis, if `risk >= webhook.min_risk`, enqueue (Cloudflare Queues if available, else inline `ctx.waitUntil`) an HMAC-signed POST.
- Header `X-FilterCalls-Signature: sha256=…` over body using webhook.secret.

### 3.5 — Dashboard (real, not mock)
- `app/(dashboard)/dashboard/page.tsx` (server component) reads from D1:
  - last 50 analyses for the authenticated key
  - sparkline of analyses/hour (last 24h)
  - intent distribution donut
  - quota usage bar
- Use `@radix-ui/react-*` primitives + Tailwind. No charting lib > 30 KB; prefer hand-rolled SVG sparklines.

### 3.6 — Public API docs
- Add `app/docs/page.tsx` rendering `openapi.yaml` via Stoplight Elements (or a static HTML viewer).
- Generate `openapi.yaml` from a single source-of-truth zod schema in `lib/api-schema.ts`.
- Provide `/postman.json` collection download.

### 3.7 — UI polish
- Replace native `<select>` country picker with a Radix `Combobox` showing flag + name + dial code, searchable.
- Auto-detect country as the user types using `libphonenumber-js` `AsYouType`.
- Recent-analyses sidebar (localStorage, last 20).
- "Compare numbers" mode (up to 4 side-by-side).
- Theme toggle (system / light / dark) with `next-themes`.

### 3.8 — Reliability
- Add Sentry (`@sentry/nextjs` edge-compatible build).
- Replace `console.*` with a `lib/log.ts` structured logger (JSON lines).
- GitHub Actions workflow `.github/workflows/ci.yml`:
  - matrix: `pnpm typecheck`, `pnpm lint`, `pnpm test`
  - on PR: deploy Cloudflare Pages preview
  - on push to main: deploy production

### Phase 3 Acceptance Criteria
- ✅ `POST /api/analyze` requires a valid API key (except a `/api/analyze/demo` route limited to 10 req/IP/day).
- ✅ Bulk endpoint handles 100 numbers in < 4 s p95.
- ✅ A webhook fires within 5 s of a `risk >= 80` analysis and verifies signature in the included echo-server test.
- ✅ Dashboard renders real D1 data with 0 client-side waterfalls.
- ✅ CI green on PR; preview URL posted by GitHub bot.

---

## 📦 Deliverables checklist (per PR)

- [ ] Code changes scoped to phase
- [ ] Vitest tests added/updated
- [ ] `README.md` section updated
- [ ] `CHANGELOG.md` entry under `## [Unreleased]`
- [ ] Migration files (Phase 3) idempotent
- [ ] No new ESLint warnings
- [ ] Bundle analyzer diff attached as PR comment

---

## ❓ When in doubt
- Prefer **deleting** old code over commenting it out.
- Prefer **explicit errors** over silent fallbacks.
- Prefer **pure functions** in `lib/engine/**`; side effects only in `app/api/**`.

End of prompt.

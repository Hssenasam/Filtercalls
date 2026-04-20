# FilterCalls

FilterCalls is a Cloudflare-friendly **Call Intent Intelligence Platform** built with Next.js App Router and TypeScript.

## Product highlights

- Intent-based call analysis (not just spam vs safe)
- Dual score model (risk + trust)
- Recommended-action engine (block/silence/vm/caution/answer)
- Signal breakdown UI for transparent decision support
- Dual audience messaging for individuals and API-first businesses
- Cloudflare Pages-compatible API route architecture (Edge runtime)

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide icons

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

Copy env template:

```bash
cp .env.example .env.local
```

- `APILAYER_KEY` (optional): API key for the APILayer Number Verification provider.

## Hybrid intelligence architecture

FilterCalls uses a hybrid pipeline:

1. **External metadata (APILayer)** for number validity, country, region, carrier, line type, and formatting.
2. **Internal intent engine** for deterministic scoring and decision logic (risk/trust/intent/nuisance/action).

If `APILAYER_KEY` is not set, or if the provider request fails, the system automatically falls back to internal analysis without breaking the API contract.

External metadata is normalized before scoring and mapped into the stable internal output model (`formatted_number`, `country`, `region`, `carrier`, `line_type`, `is_valid`).

## API endpoint

### `POST /api/analyze`

Request body:

```json
{
  "number": "+14155550142",
  "country": "US"
}
```

Response includes:

- `risk_score`
- `trust_score`
- `nuisance_level`
- `probable_intent`
- `recommended_action`
- `signals[]`


### `POST /api/analyze/batch`

Batch analyze up to 100 numbers in one request. Requires `X-API-Key`.

### `GET /api/openapi.json`

Returns OpenAPI 3.1 JSON for the API surface.

### `GET/POST /api/admin/keys` and `DELETE /api/admin/keys/{id}`

Admin-managed API key lifecycle endpoints secured by `X-Admin-Token`. Only key hashes are stored; raw key is shown once on create.

### `GET/POST/DELETE /api/webhooks`

API-key managed webhook configuration endpoints. Webhook delivery supports signed payloads (`X-FC-Signature`) and retries.

### `GET /dashboard`

D1-backed analytics dashboard with masked numbers, rolling windows (24h/7d/30d), top countries, and recent analyses.

## Deployment to Cloudflare Pages

Use Next.js on Cloudflare Pages Functions.

1. Push this repository.
2. Connect to Cloudflare Pages.
3. Set build command: `npm run build`.
4. Set output: `.vercel/output/static` (if using adapter) or deploy via OpenNext Cloudflare pipeline.
5. Add environment variables in Pages settings.

For production, pair with Cloudflare-compatible Next adapter (OpenNext for Cloudflare) and keep route handlers in edge runtime for low latency.


## Portal (Phase 4)

Public self-serve portal routes:
- `/signup`, `/login`, `/forgot-password`, `/reset-password`
- `/portal/overview`, `/portal/keys`, `/portal/webhooks`, `/portal/usage`, `/portal/settings`, `/portal/docs`

Environment variables:
- `SESSION_SECRET` (required, 32+ random bytes base64)
- `CSRF_SECRET` (required, 32+ random bytes base64)
- `RESEND_API_KEY` (optional)
- `PORTAL_BASE_URL` (required for reset/verify links)

Screenshots placeholders:
- `Docs/screenshots/portal-signup.png`
- `Docs/screenshots/portal-overview.png`
- `Docs/screenshots/portal-keys-modal.png`

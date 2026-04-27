# Phase 6A UX Audit — FilterCalls

Date: 2026-04-27
Scope: SaaS UX Excellence & Reliability
Mode: Scout pass only — no code changes

## Executive Summary

- `/features` route is missing (`src/app/features/` does not exist), which creates a HIGH risk if any header/navigation element links to it in future updates.
- `/api-docs` exists and renders as a full public page, but it is missing from `src/app/sitemap.ts` (confirmed SEO discovery gap).
- `src/app/robots.ts` uses an overly explicit `allow` list instead of the safer broad `allow: ['/']` + targeted `disallow`; key public pages (`/about`, `/pricing`, `/solutions`, `/contact`) are not explicitly listed.
- `SiteFooter` body description uses `text-white/35`, below WCAG AA expectations for body text contrast on dark backgrounds.
- `SiteFooter` navigation links use `text-white/40`, below recommended contrast for navigational text.
- Footer layout uses `grid-cols-2 md:grid-cols-7`; this can feel cramped on 375px-wide devices when rendering five link groups (Needs verification with visual QA).
- `/dashboard` and `/dashboard-preview` exist in `src/app/` but are currently unclassified in robots/sitemap policy (Needs verification for intended crawl/index behavior).
- `/help` route does not exist and should be added later as a trust anchor and support center in PR 7.

## Section 1 — Broken Routes & Route Hygiene

| Route | Exists? | Metadata? | In sitemap? | In robots allow? | Linked from footer/header? | Notes |
|---|---|---|---|---|---|---|
| `/` | Yes | Yes (`src/app/page.tsx`) | Yes | Yes | Yes (header + footer logo) | Public root page is healthy. |
| `/analysis` | Yes | No page-level metadata (inherits global) | Yes | Yes | Yes (footer CTA + links) | Consider page metadata in SEO pass. |
| `/features` | **No** | N/A | No | No | No (hidden by footer guard, not in header routes) | Missing route; high risk if referenced later. |
| `/scams` | Yes | Yes | Yes | Yes | Yes (header + footer) | Public content route; indexed. |
| `/pricing` | Yes | Yes | Yes | **No** (not explicitly allowed) | Yes (header + footer) | Robots allow list pattern is brittle. |
| `/solutions` | Yes | Yes | Yes | **No** (not explicitly allowed) | Footer only | Public page should be covered by broad allow. |
| `/security` | Yes | Yes | Yes | Yes | Yes (header + footer) | Public trust route is indexed. |
| `/api-docs` | Yes | No page-level metadata export detected | **No** | **No** (not explicitly allowed) | Header + footer | Confirmed sitemap gap and robots allow-list gap. |
| `/report` | **No** (no `src/app/report/page.tsx`) | N/A | No | Yes (via `/report/`) | Not in header/footer | `/report/[hash]` exists, but `/report` landing is missing. |
| `/about` | Yes | Yes | Yes | **No** (not explicitly allowed) | Header + footer | Public page should be broadly crawl-allowed. |
| `/contact` | Yes | Yes (`src/app/contact/layout.tsx`) | Yes | **No** (not explicitly allowed) | Header + footer | Public page; allow-list omission is brittle. |
| `/changelog` | Yes | Yes | Yes | Yes | Footer only | Public page indexed in sitemap. |
| `/insights` | Yes | Yes | Yes | Yes | Footer only | Public page indexed and crawlable. |
| `/help` | **No** | N/A | No | No | No | Missing route; recommended in PR 7. |
| `/privacy` | Yes | Yes | Yes | Yes | Footer bottom bar | Public legal page is indexed. |
| `/dashboard` | Yes | No page-level metadata | No | No | No | **Needs verification:** preview/public vs protected intent. |
| `/dashboard-preview` | Yes | No page-level metadata | No | No | No | **Needs verification:** marketing preview vs internal route. |
| `/portal/overview` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly excluded from sitemap. |
| `/portal/settings` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly private. |
| `/portal/billing` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly private. |
| `/portal/keys` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly private. |
| `/portal/webhooks` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly private. |
| `/portal/usage` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly private. |
| `/portal/docs` | Yes | Portal layout metadata context | No | No (disallowed by `/portal/`) | No | Correctly private. |

Additional route hygiene notes:
- `SiteFooter` has `isExistingRoute()` guard and therefore does not render broken links like `/features` today.
- `site-header.tsx` currently consumes `getHeaderRoutes()` and `COMPANY_LINKS`; no direct `/features` hardcoded link is present.

## Section 2 — Footer Tree / Layout Stability

| File | Usage type | Safe? | Notes |
|---|---|---|---|
| `src/components/layout/site-shell.tsx` | Imports and renders `<SiteFooter />` inside shared shell | Risk | Intended single global render point for public pages. |
| `src/app/page.tsx` | Imports and renders `<SiteFooter />` directly | **Not safe** | Creates duplicate footer on homepage because `SiteShell` also renders footer. |
| `src/components/layout/site-footer.tsx` | Footer component definition | Needs guardrail | Should be rendered once from shell/layout only. |

Findings:
- Footer duplication risk is real today on homepage due to rendering in both `SiteShell` and `src/app/page.tsx`.
- Secondary CTA duplication is possible when page-level footer CTA and shell-level footer CTA both render.

Recommendation:
- `SiteFooter` should render once in root public shell/layout only.
- Remove page-level rendering of `SiteFooter` from content pages.
- Add JSDoc warning in `SiteFooter` component to prevent direct per-page use.

## Section 3 — Color / Contrast Audit

| File | Line / pattern | Current class | Context | Severity | Recommendation |
|---|---|---|---|---|---|
| `site-footer.tsx` | brand description paragraph | `text-white/35` | body text | HIGH | Raise to `text-white/70+` |
| `site-footer.tsx` | nav link `<Link>` items | `text-white/40` | nav link | MEDIUM | Raise to `text-white/65+` |
| `site-footer.tsx` | copyright line | `text-white/25` | decorative | LOW | Raise to `text-white/40+` |
| `site-footer.tsx` | bottom bar utility links | `text-white/25` | footer links | MEDIUM | Raise to `text-white/50+` |
| `src/app/page.tsx` | discovery subtitle text | `text-white/55` | helper/body copy | MEDIUM | Raise to `text-white/60+` |
| `src/app/page.tsx` | “Seen a suspicious number?” link | `text-white/55` | secondary nav cue | MEDIUM | Raise to `text-white/65+` |
| `src/components/layout/site-header.tsx` | account sublabel | `text-white/45` | helper text | MEDIUM | Raise to `text-white/60+` |
| `src/components/layout/site-header.tsx` | section eyebrow in drawer | `text-white/35` | label text | HIGH | Raise to `text-white/70+` |
| `src/components/sections/home-hero.tsx` | input placeholder | `placeholder:text-white/25` | input assistive text | MEDIUM | Raise placeholder contrast to `text-white/45+` |

Severity thresholds used:
- HIGH: body paragraph, label, nav link, CTA text, form text
- MEDIUM: helper text, card description, secondary footer link
- LOW: decorative text, eyebrow label, copyright line

Recommended minimums:
- Body text: `text-white/80+`
- Headings: `text-white/90+`
- Labels: `text-white/80+`
- Helper text: `text-white/60+`
- Nav links: `text-white/65+`
- Decorative: `text-white/40+` acceptable

## Section 4 — Form Fields Inventory

| Form / Page | Fields count | Multi-column? | Labels present? | Placeholder as label? | Error state? | Notes |
|---|---:|---|---|---|---|---|
| `/signup` (`src/app/(portal)/signup/page.tsx`) | 6 (name, email, confirm email, phone, password, confirm password) | Yes (`sm:grid-cols-2`) | No explicit `<label>` controls | Yes | Yes (inline status text) | High friction; includes confirm email + required phone. |
| `/login` (`src/app/(portal)/login/page.tsx`) | 2 (identifier, password) | No | No explicit labels | Yes | Yes (inline error message) | Usable but should add explicit labels/`htmlFor`. |
| `/contact` (`src/components/contact/contact-form.tsx`) | 6 typical fields + message | Sometimes 2-col (`sm:grid-cols-2`) | No explicit labels | Yes | Yes (`role="alert"`) | Good error semantics; labels should be explicit. |
| `/pricing` custom request (`src/components/contact/custom-plan-form.tsx`) | 6 fields including company/use-case/message | Yes (`sm:grid-cols-2`) | No explicit labels | Yes | Yes (`role="alert"`) | Similar label/accessibility issue. |
| Homepage phone input (`src/components/sections/home-hero.tsx`) | 1 | No | No | Yes | Yes (error copy shown) | Placeholder-only field in hero. |
| Analysis phone input (`src/components/PhoneInput.tsx`) | 1 (+ country selector) | No | Hidden/sr label present | Partial | Yes | Better than hero; still verify mobile ergonomics. |

Recommendations:
- Keep forms single-column on mobile at 375px.
- Evaluate removing confirm-email from signup.
- Make phone optional unless required for auth/security policy.
- Keep inline errors with `role="alert"` (already present in contact forms).
- Add text: “All fields required unless marked optional.”

## Section 5 — Mobile Touch Targets

| File | Element | Has min-h/min-w 44px? | Mobile risk | Recommendation |
|---|---|---|---|---|
| `site-header.tsx` | mobile menu trigger button | Borderline (`p-2`, icon-only) | Medium | Set explicit `h-11 w-11` minimum. |
| `site-header.tsx` | drawer nav links | Mostly yes (`px-4 py-3`) | Low | Keep 48px preferred vertical rhythm. |
| `site-header.tsx` | drawer close button | Borderline (icon-only) | Medium | Ensure `h-11 w-11`. |
| `home-hero.tsx` | Analyze CTA | Yes (`py-3`) | Low | Keep as primary large target. |
| `pricing/page.tsx` | plan CTA links/buttons | Mostly yes | Low | Verify on 375px with dynamic text wrapping. |
| `contact-form.tsx` / `custom-plan-form.tsx` | submit buttons | Yes (`py-2` to `py-3`) | Low | Normalize to >=44px for consistency. |
| `site-footer.tsx` | footer links | Likely <44px | Medium | Increase vertical padding/line-height in mobile footer lists. |

Rules applied:
- Core interactive elements target minimum 44×44px.
- Mobile drawer links ideally 48px height.
- Footer links require padding adjustments on 375px screens.

## Section 6 — Responsive Layout Audit

| File | Pattern | Mobile safe? | Risk | Recommendation |
|---|---|---|---|---|
| `site-footer.tsx` | `grid-cols-2 md:grid-cols-7` | Needs verification | 5 link groups may feel cramped on 375px | Use `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7` |
| `contact-form.tsx` | `sm:grid-cols-2` | Yes | Low | Keep single column below `sm`; verify field order. |
| `custom-plan-form.tsx` | `sm:grid-cols-2` | Yes | Low | Keep; ensure long labels do not overflow. |
| `signup/page.tsx` | repeated `sm:grid-cols-2` blocks | Needs verification | Dense form content on small screens | Keep mobile single-column; simplify field count in PR 5. |
| `page.tsx` discovery cards | `md:grid-cols-3` | Yes | Low | Mobile is single-column today. |
| `feature-grid.tsx` | `grid-cols-2 md:grid-cols-4` for mini stats | Needs verification | Two columns may still be compact with long labels | Test at 320/375 widths. |

Recommended mobile-first pattern:
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

## Section 7 — SEO Metadata Table

| Route | title | description | canonical | openGraph | In sitemap? | Notes |
|---|---|---|---|---|---|---|
| `/` | Yes | Yes | Yes | Yes | Yes | Healthy metadata coverage. |
| `/features` | N/A | N/A | N/A | N/A | No | Missing route and sitemap entry. |
| `/scams` | Yes | Yes | Yes | Yes | Yes | Good coverage. |
| `/pricing` | Yes | Yes | Yes | No explicit OG export | Yes | Add explicit OG in SEO pass. |
| `/solutions` | Yes | Yes | Yes | No explicit OG export | Yes | Add explicit OG in SEO pass. |
| `/security` | Yes | Yes | Yes | Yes | Yes | Good coverage. |
| `/api-docs` | No explicit metadata export | No explicit metadata export | No explicit canonical export | No explicit OG export | **No** | Confirmed sitemap + metadata gap. |
| `/report` | N/A (route missing) | N/A | N/A | N/A | No | `/report/[hash]` exists with metadata. |
| `/about` | Yes | Yes | Yes | No explicit OG export | Yes | Acceptable, can be improved. |
| `/contact` | Yes (via contact layout) | Yes | Yes | No explicit OG export | Yes | Metadata exists at layout level. |
| `/changelog` | Yes | Yes | Yes | No explicit OG export | Yes | Acceptable baseline. |
| `/insights` | Yes | Yes | Yes | No explicit OG export | Yes | Page includes JSON-LD WebPage object. |
| `/help` | N/A | N/A | N/A | N/A | No | Missing route and sitemap entry. |

Rules applied:
- Public pages should have unique title/description/canonical/OG.
- Private `/portal` and `/api` routes should not appear in sitemap.

## Section 8 — Robots / Sitemap Audit

ROBOTS.TS — CONFIRMED ISSUES:
1. `allow` list is over-specified and enumerates only selected paths.
   - `/about`, `/pricing`, `/solutions`, `/contact` are not in allow list.
   - Better pattern: `allow: ['/']` with targeted `disallow` entries.
   - Severity: MEDIUM (risk of inconsistent crawler behavior and under-crawl).

2. `/dashboard` and `/dashboard-preview` are not in disallow list.
   - If these routes are private/internal preview, they should be disallowed.
   - Status: Needs verification (product intent not yet explicit).

SITEMAP.TS — CONFIRMED ISSUES:
1. `/api-docs` exists but is not listed in sitemap (SEO gap).
2. `/features` does not exist (correctly absent from sitemap for now).
3. `/help` does not exist (correctly absent from sitemap for now).

| Item | Status | Notes | Recommended PR |
|---|---|---|---|
| `robots.ts` allow strategy | Issue | Overly explicit allow list | PR 6 |
| `/dashboard` and `/dashboard-preview` policy | Needs verification | Determine public vs private intent | PR 6 |
| `/api-docs` in sitemap | Issue | Missing despite public route | PR 1 |
| `/features` route | Missing route | Do not add to sitemap until page exists | PR 1 |
| `/help` route | Missing route | Add page + sitemap entry later | PR 7 |

## Section 9 — Prioritized Fix Plan

PR 1 — Route Hygiene, 404 & Navigation Trust
- Fixes: custom 404 page, `/features` route creation, `/report` landing page, broken header links audit, `/api-docs` added to sitemap.
- Files likely: `src/app/not-found.tsx`, `src/app/features/page.tsx`, `src/app/report/page.tsx`, `src/app/sitemap.ts`.
- Risk: Low — isolated route additions.
- Acceptance criteria:
  - ✅ `/features` renders without 404
  - ✅ `/report` (no hash) renders a useful landing
  - ✅ Custom 404 page exists and is helpful
  - ✅ `/api-docs` in `sitemap.ts`
  - ✅ No broken links in header/footer

PR 2 — Footer Duplication & Layout Stability
- Fixes: ensure `SiteFooter` renders once only, remove page/section-level footer usage, add JSDoc warning to `SiteFooter`.
- Files likely: `src/components/layout/site-footer.tsx`, `src/components/layout/site-shell.tsx`, `src/app/page.tsx`.
- Risk: Low — structural cleanup, no visual redesign.
- Acceptance criteria:
  - ✅ `SiteFooter` imported in exactly one layout/shell file
  - ✅ No page component renders `SiteFooter` directly
  - ✅ JSDoc comment added

PR 3 — Mobile UX, Touch Targets & Responsive Forms
- Fixes: tap targets ≥44px, mobile drawer control sizing, public forms single-column on mobile, footer grid mobile fix.
- Files likely: `src/components/layout/site-header.tsx`, `src/components/layout/site-footer.tsx`, `src/app/(portal)/signup/page.tsx`, `src/app/contact/page.tsx`.
- Risk: Medium — visual and interaction changes.
- Acceptance criteria:
  - ✅ All tap targets ≥44px
  - ✅ Forms single-column at 375px
  - ✅ Footer readable at 375px

PR 4 — Accessibility & Contrast Pass
- Fixes: `text-white/35 → text-white/70+` (body), `text-white/40 → text-white/65+` (nav), focus-visible states, label/htmlFor in forms, heading hierarchy check.
- Files likely: `src/components/layout/site-footer.tsx`, `src/components/layout/site-header.tsx`, `src/app/page.tsx`, form components.
- Risk: Low — color/semantic refinements.
- Acceptance criteria:
  - ✅ No body text below `text-white/65`
  - ✅ All nav links ≥ `text-white/65`
  - ✅ WCAG AA verified on core surfaces

PR 5 — Forms Conversion Cleanup
- Fixes: reduce signup friction (evaluate confirm-email), clarify optional fields, inline errors with `role="alert"`, success feedback consistency.
- Files likely: `src/app/(portal)/signup/page.tsx`, `src/components/contact/contact-form.tsx`, `src/components/contact/custom-plan-form.tsx`.
- Risk: Medium — auth conversion behavior changes.
- Acceptance criteria:
  - ✅ Registration form reduced to <=4 required fields (or <=2-step flow)
  - ✅ All errors inline with `role="alert"`
  - ✅ Optional fields clearly labeled

PR 6 — SEO & Performance Hygiene
- Fixes: metadata pass across public pages, `robots.ts` allow/disallow normalization, `/dashboard` classification, reduced-motion audit.
- Files likely: `src/app/robots.ts`, `src/app/sitemap.ts`, affected public `page.tsx` metadata blocks.
- Risk: Low — config/metadata only.
- Acceptance criteria:
  - ✅ `robots.ts` uses `allow: ['/']` pattern
  - ✅ `/dashboard` and `/dashboard-preview` clearly classified
  - ✅ All public pages have unique title + description + canonical + OG

PR 7 — Help Center & Trust Anchor Page
- Fixes: create `/help` with FAQ + glossary + trust answers; add footer link to `/help`; include in sitemap; add FAQPage JSON-LD.
- Files likely: `src/app/help/page.tsx`, `src/components/layout/site-footer.tsx`, `src/app/sitemap.ts`.
- Risk: Low — additive route.
- Acceptance criteria:
  - ✅ `/help` renders without 404
  - ✅ Footer links to `/help`
  - ✅ `/help` appears in `sitemap.ts`
  - ✅ FAQPage JSON-LD present

## Section 10 — Non-Goals

This audit does NOT implement:
- Phase 5A.4 recipient report view (separate PR)
- Phase 6B.0 account profile/security pages (separate PR)
- Any new API routes
- Billing or auth changes
- Database or migration changes
- Package additions or removals
- Visual redesign or rebrand
- Mobile app
- i18n / localization
- Analytics or tracking changes

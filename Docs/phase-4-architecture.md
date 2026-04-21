# Phase 4 Portal Architecture

```text
Browser
  │ (HttpOnly session cookie + csrf token)
  ▼
Next.js portal routes (/api/portal/*)
  │ verify JWT session + CSRF + tenant ownership
  ▼
D1 (users, sessions, api_keys.user_id, webhooks.user_id, analyses.user_id)
  │
  └─ Usage/dashboard queries filtered by user_id
```

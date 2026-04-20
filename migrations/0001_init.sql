CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  e164 TEXT NOT NULL,
  country TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  engine_version TEXT,
  cache_status TEXT,
  layers_json TEXT,
  api_key_id TEXT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  name TEXT,
  key_hash TEXT UNIQUE,
  created_at INTEGER,
  last_used_at INTEGER NULL,
  revoked_at INTEGER NULL,
  rate_limit_per_min INTEGER DEFAULT 60
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  api_key_id TEXT,
  url TEXT,
  secret TEXT,
  event_types TEXT,
  created_at INTEGER,
  disabled_at INTEGER NULL
);

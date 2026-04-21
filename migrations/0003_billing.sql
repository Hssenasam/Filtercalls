CREATE TABLE IF NOT EXISTS billing_accounts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  billing_status TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_billing_accounts_plan_status ON billing_accounts(plan_id, billing_status);
CREATE INDEX IF NOT EXISTS idx_billing_accounts_stripe_customer ON billing_accounts(stripe_customer_id);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO billing_accounts (user_id, plan_id, billing_status, created_at, updated_at)
SELECT id, 'free', 'free', strftime('%s','now') * 1000, strftime('%s','now') * 1000 FROM users;

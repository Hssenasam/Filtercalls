CREATE TABLE IF NOT EXISTS community_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number_hash TEXT NOT NULL,
  calling_code TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  comment TEXT,
  source_context TEXT,
  reporter_type TEXT NOT NULL DEFAULT 'guest',
  reporter_user_id TEXT,
  reporter_plan TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cr_number_hash ON community_reports(number_hash);
CREATE INDEX IF NOT EXISTS idx_cr_created_at ON community_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_cr_category ON community_reports(category);
CREATE INDEX IF NOT EXISTS idx_cr_calling_code ON community_reports(calling_code);

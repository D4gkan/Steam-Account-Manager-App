-- Steam Account Manager App -- schema v1
-- SteamID64 is stored as TEXT everywhere to avoid integer precision loss.

CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,                       -- UUID
  steam_id64 TEXT UNIQUE,                    -- TEXT, nullable until confirmed
  steam_name TEXT,
  custom_label TEXT,
  avatar_cache_path TEXT,
  profile_relative_path TEXT NOT NULL UNIQUE,-- UUID-based; stable across renames
  onboarding_status TEXT NOT NULL DEFAULT 'pending_login',
  created_at TEXT NOT NULL,
  metadata_updated_at TEXT
);

CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY,                       -- UUID
  display_name TEXT NOT NULL,
  launch_url TEXT NOT NULL,
  match_config TEXT NOT NULL,                -- JSON: WebsiteMatchConfig
  icon_cache_path TEXT,
  icon_source TEXT NOT NULL DEFAULT 'none',
  catalog_position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS extension_packages (
  extension_key TEXT PRIMARY KEY,
  expected_legacy_id TEXT,
  actual_id TEXT,
  version TEXT,
  source TEXT NOT NULL,
  digest TEXT,
  package_relative_path TEXT NOT NULL,
  compatibility_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS account_extension_status (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  extension_key TEXT NOT NULL REFERENCES extension_packages(extension_key),
  installed_version TEXT,
  verified_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_code TEXT,
  PRIMARY KEY (account_id, extension_key)
);

CREATE TABLE IF NOT EXISTS settings (
  schema_version INTEGER NOT NULL,
  catalog_seed_version INTEGER NOT NULL
);

INSERT INTO schema_meta (key, value)
  SELECT '001_init', 'applied'
  WHERE NOT EXISTS (SELECT 1 FROM schema_meta WHERE key = '001_init');

-- Remove sites that were previously distributed as defaults. This migration
-- also updates existing local catalogs, not just fresh installations.
DELETE FROM websites
WHERE launch_url IN (
  'http://haram.cash:8888/',
  'https://tradingdashboardv1.vercel.app/',
  'https://gayme.celya.tech/'
)
OR display_name IN (
  'haram.cash',
  'Trading Dashboard',
  'gayme.celya.tech'
);

INSERT INTO schema_meta (key, value)
  SELECT '002_remove_retired_default_sites', 'applied'
  WHERE NOT EXISTS (SELECT 1 FROM schema_meta WHERE key = '002_remove_retired_default_sites');

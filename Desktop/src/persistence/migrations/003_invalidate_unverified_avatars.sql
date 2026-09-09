-- Earlier page-wide selectors could cache a friend's picture. Fetch it again
-- from the identity-checked account field; leave all account/session data intact.
UPDATE accounts SET avatar_cache_path = NULL;
INSERT INTO schema_meta (key, value) VALUES ('003_invalidate_unverified_avatars', 'applied');

const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { openDatabase } = require('../dist/main/persistence/db');
const { AccountRepository } = require('../dist/main/persistence/repositories/accountRepository');
const { WebsiteRepository } = require('../dist/main/persistence/repositories/websiteRepository');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-db-test-'));
const file = path.join(folder, 'db.sqlite');
let handle = openDatabase(file);
let websites = new WebsiteRepository(handle.db);
const original = websites.listAll(); assert.equal(original.length, 8);
assert.equal(original[0].displayName, 'Steam');
assert.throws(() => websites.reorder([original[0].id, original[0].id]));
assert.deepEqual(websites.listAll().map(w => w.id), original.map(w => w.id));
websites.remove(original[0].id);
const accounts = new AccountRepository(handle.db);
const a = accounts.createPending(); accounts.confirmIdentity(a.id, '76561198012345678', 'Initial name', null); accounts.setCustomLabel(a.id, 'My label'); accounts.refreshMetadata(a.id, 'New name', null);
assert.equal(accounts.findById(a.id).customLabel, 'My label'); assert.equal(accounts.findById(a.id).steamId64, '76561198012345678');
assert.throws(() => accounts.confirmIdentity(a.id, 76561198012345678, 'Bad', null));
const duplicate = accounts.createPending(); assert.throws(() => accounts.confirmIdentity(duplicate.id, '76561198012345678', 'Duplicate', null));
assert.equal(accounts.findById(duplicate.id).steamId64, null);
handle.close(); handle = openDatabase(file); websites = new WebsiteRepository(handle.db);
assert.equal(websites.listAll().length, 7); assert.equal(websites.findById(original[0].id), null);
for (const [name, url] of [
  ['haram.cash', 'http://haram.cash:8888/'],
  ['Trading Dashboard', 'https://tradingdashboardv1.vercel.app/'],
  ['gayme.celya.tech', 'https://gayme.celya.tech/'],
]) websites.add(name, url);
handle.db.prepare("DELETE FROM schema_meta WHERE key = '002_remove_retired_default_sites'").run();
handle.close(); handle = openDatabase(file); websites = new WebsiteRepository(handle.db);
assert.equal(websites.listAll().length, 7, 'retired defaults must be removed from existing catalogs');
handle.db.prepare('UPDATE accounts SET avatar_cache_path = ? WHERE id = ?').run('old-unverified.png', a.id);
const beforeAvatarReset = new AccountRepository(handle.db).findById(a.id);
handle.db.prepare("DELETE FROM schema_meta WHERE key = '003_invalidate_unverified_avatars'").run();
handle.close(); handle = openDatabase(file);
const afterAvatarReset = new AccountRepository(handle.db).findById(a.id);
assert.deepEqual(afterAvatarReset, { ...beforeAvatarReset, avatarCachePath: null });
handle.db.prepare('UPDATE accounts SET avatar_cache_path = ? WHERE id = ?').run('new-verified.png', a.id);
handle.close(); handle = openDatabase(file);
assert.equal(new AccountRepository(handle.db).findById(a.id).avatarCachePath, 'new-verified.png', 'cache reset runs only once');
handle.close(); console.log('PASS SQLite: seeds, identity and labels preserved, duplicate rollback, unverified avatar invalidated once without changing other account fields.');

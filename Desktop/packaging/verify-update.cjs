const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const asar = require('@electron/asar');
const { extensionId } = require('../dist/main/services/extensions/extensionStager');
const root = path.resolve(process.argv[2] || 'release/win-unpacked/resources');
const archive = path.join(root, 'app.asar');
const read = name => asar.extractFile(archive, name.split('/').join(path.sep)).toString();
assert.equal(JSON.parse(read('package.json')).version, '1.1.0');
assert(read('dist/main/main/ipc.js').includes('refreshAvatar'));
assert(read('dist/main/services/metadata/steamAvatar.js').includes('profileAvatarUrls'));
assert(read('dist/main/services/extensions/extensionStager.js').includes('CSFloat'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extensions/csfloat-market-checker/manifest.json')));
assert.equal(extensionId(manifest.key), 'jjicbefpemnphinccgikpdaagjebbnhg');
assert(fs.readFileSync(path.join(root, 'companion-extension/identity-content-script.js'), 'utf8').includes('Never infer avatar ownership'));
assert(read('dist/main/persistence/migrations/003_invalidate_unverified_avatars.sql').includes('avatar_cache_path = NULL'));
assert(read('dist/main/services/browser/browserManager.js').includes("'start_fresh'"));
assert(fs.readFileSync(path.join(root, 'companion-extension/background.js'), 'utf8').includes("case 'start_fresh'"));
assert(fs.readFileSync(path.join(root, 'companion-extension/tab-policy.js'), 'utf8').includes('/onboarding.html'));
const forbidden = /^(?:app\.sqlite3(?:-wal|-shm)?|Cookies|Login Data|History|companion-key\.json|profile-config\.js|token)$/;
for (const item of asar.listPackage(archive)) assert(!forbidden.test(path.basename(item)), 'Unexpected private data file in archive');
// The companion template deliberately has no per-account profile-config.js.
for (const dir of ['extensions', 'companion-extension', 'native-bridge', 'runtime']) {
  const walk = folder => { for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    assert(!forbidden.test(entry.name), 'Unexpected private data file in packaged resources');
    if (entry.isDirectory()) walk(path.join(folder, entry.name));
  } };
  walk(path.join(root, dir));
}
console.log('PASS: version 1.1.0 includes clean browser startup, onboarding suppression, previous fixes, and no account database/session files.');

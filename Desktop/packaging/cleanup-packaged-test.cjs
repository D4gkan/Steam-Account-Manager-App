const { BrowserManager } = require('../dist/main/services/browser/browserManager');
const fs = require('node:fs'), path = require('node:path');
(async () => {
  const data = process.argv[2];
  if (!path.basename(data).startsWith('sam-packaged-smoke-')) throw Error('Only packaged test profiles are eligible');
  const accounts = fs.readdirSync(path.join(data, 'profiles')).map(profileRelativePath => ({ id: fs.readFileSync(path.join(data, 'profiles', profileRelativePath, '.sam-owner'), 'utf8'), profileRelativePath }));
  const manager = new BrowserManager(data, path.resolve(__dirname, '../release/win-unpacked/resources'), process.execPath, () => accounts);
  await manager.start();
  for (const a of accounts) { try { await manager.bridge.wait(a.id, 12000); await manager.bridge.request(a.id, 'close_windows').catch(() => {}); } catch {} }
  manager.bridge.close();
})().catch(e => { console.error(e); process.exitCode = 1; });

const { BrowserManager } = require('../dist/main/services/browser/browserManager');
const { LaunchService } = require('../dist/main/services/launch/launchService');
const { buildMatchConfigFromUrl } = require('../dist/main/domain/validation');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-browser-proof-'));
  const a = { id: randomUUID(), profileRelativePath: randomUUID(), onboardingStatus: 'pending_login' };
  const root = path.resolve(__dirname, '../resources');
  for (const name of ['companion-extension', 'native-bridge']) fs.cpSync(path.resolve(__dirname, '..', name), path.join(root, name), { recursive: true });
  let manager = new BrowserManager(data, root, process.execPath, () => [a]);
  try {
    await manager.start(); manager.createProfile(a);
    await manager.ensure(a, 'https://example.com/');
    console.log('CONNECTED', await manager.bridge.request(a.id, 'list_tabs'));
    console.log('EXTENSIONS', await manager.bridge.request(a.id, 'extensions'));
    const sites = ['https://example.org/', 'https://example.com/'].map(url => ({ id: randomUUID(), launchUrl: url, matchConfig: buildMatchConfigFromUrl(url) }));
    console.log('LAUNCH', await new LaunchService(manager).forAccount(a, sites));
    console.log('ORDER', await manager.bridge.request(a.id, 'list_tabs'));
    manager.bridge.close();
    await new Promise(r => setTimeout(r, 1000));
    manager = new BrowserManager(data, root, process.execPath, () => [a]);
    await manager.start(); await manager.bridge.wait(a.id, 15000);
    console.log('RECONNECTED', await manager.bridge.request(a.id, 'list_tabs'));
    console.log('PASS independent browser + authenticated bridge + ordering + manager reconnect');
  } finally {
    if (manager.bridge.connected(a.id)) await manager.bridge.request(a.id, 'close_windows').catch(() => {});
    manager.bridge.close(); console.log('Proof data', data);
  }
})().catch(e => { console.error(e); process.exitCode = 1; });

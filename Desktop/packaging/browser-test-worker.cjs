const { BrowserManager } = require('../dist/main/services/browser/browserManager');
const { LaunchService } = require('../dist/main/services/launch/launchService');
const path = require('node:path');
const fs = require('node:fs');
const data = process.argv[2];
const accounts = JSON.parse(fs.readFileSync(path.join(data, 'test-accounts.json'), 'utf8'));
const manager = new BrowserManager(data, path.resolve(__dirname, '../resources'), process.execPath, () => accounts);
const launch = new LaunchService(manager);
manager.start().then(() => process.send({ ready: true })).catch(e => { process.send({ error: e.message }); process.exit(1); });
process.on('message', async msg => {
  try {
    let result;
    const a = accounts[msg.account || 0];
    switch (msg.action) {
      case 'ensure': manager.createProfile(a); await manager.ensure(a, msg.url); result = true; break;
      case 'tabs': await manager.bridge.wait(a.id); result = await manager.bridge.request(a.id, 'list_tabs'); break;
      case 'launch': result = await launch.forAccount(a, msg.sites); break;
      case 'close': result = await manager.bridge.request(a.id, 'close_windows').catch(() => true); break;
      case 'exit': manager.bridge.close(); process.send({ id: msg.id, result: true }); setTimeout(() => process.exit(0), 50); return;
      default: throw Error('Unknown proof command');
    }
    process.send({ id: msg.id, result });
  } catch (e) { process.send({ id: msg.id, error: e.message }); }
});

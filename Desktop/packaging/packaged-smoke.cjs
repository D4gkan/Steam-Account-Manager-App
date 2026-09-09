const { _electron: electron } = require('playwright-core');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-packaged-smoke-'));
  const executable = process.argv[2] || path.resolve(__dirname, '../release/win-unpacked/Steam Account Manager App.exe');
  let app, page;
  const start = async () => { app = await electron.launch({ executablePath: executable, args: [`--user-data-dir=${data}`] }); page = await app.firstWindow(); await page.getByRole('heading', { name: 'Steam Account Manager App', exact: true }).waitFor(); };
  const quit = async () => { const processHandle = app.process(); const exited = new Promise(resolve => processHandle.once('exit', resolve)); void app.evaluate(({ app }) => app.quit()).catch(() => {}); await exited; app = null; };
  try {
    await start(); console.log('Packaged dashboard ready');
    const websites = await page.evaluate(() => window.steamAccountManager.websites.list()); assert.equal(websites.length, 8);
    const account = await page.evaluate(() => window.steamAccountManager.accounts.createPending());
    const status = await page.evaluate(() => window.steamAccountManager.status()); assert.equal(status.browserStates[account.id], 'open', JSON.stringify(status));
    const extensions = await page.evaluate(id => window.steamAccountManager.extensions(id), account.id);
    console.log('Packaged browser connected'); assert.equal(extensions.length, 8); assert(extensions.every(e => e.runtime.length === 1), JSON.stringify(extensions));
    const request = { accountIds: [account.id], orderedWebsiteIds: [websites.find(w => w.displayName === 'CSFloat').id] };
    const results = await page.evaluate(r => window.steamAccountManager.launch(r), request); assert.equal(results[0].error, null);
    await page.getByRole('listitem', { name: 'Steam', exact: true }).click();
    await quit(); console.log('Packaged manager process exited');
    await start(); console.log('Packaged manager restarted');
    for (let i = 0; i < 60; i++) { const s = await page.evaluate(() => window.steamAccountManager.status()); if (s.browserStates[account.id] === 'open') break; await new Promise(r => setTimeout(r, 250)); }
    const reconnected = await page.evaluate(() => window.steamAccountManager.status()); assert.equal(reconnected.browserStates[account.id], 'open');
    assert.equal(await page.getByRole('button', { name: 'Remove Steam from selection' }).count(), 0);
    // Close only this proof's browser using its already authenticated native bridge
    // from the running extension, via a separate proof manager after closing the app.
    await quit(); console.log('Packaged manager process exited');
    const { BrowserManager } = require('../dist/main/services/browser/browserManager');
    const manager = new BrowserManager(data, path.join(path.dirname(executable), 'resources'), process.execPath, () => [account]);
    await manager.start(); await manager.bridge.wait(account.id); await manager.bridge.request(account.id, 'close_windows').catch(() => {}); manager.bridge.close();
    console.log('PASS packaged Windows executable: SQLite catalog, native host, all 8 exact extension IDs, launch, survival/reconnection after Electron exit, no restored website selection.');
  } finally { if (app) await quit(); console.log('Packaged smoke data:', data); }
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });


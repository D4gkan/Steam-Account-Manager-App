const { _electron: electron } = require('playwright-core');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-smoke-'));
  let app;
  try {
    app = await electron.launch({ args: [path.resolve(__dirname, '..'), `--user-data-dir=${data}`] });
    const page = await app.firstWindow();
    await page.getByRole('heading', { name: 'Steam Account Manager App', exact: true }).waitFor();
    const sites = await page.evaluate(() => window.steamAccountManager.websites.list());
    if (sites.length !== 8 || sites[0].launchUrl !== 'https://store.steampowered.com/') throw new Error('Catalog seed mismatch');
    await page.getByRole('listitem', { name: 'Steam', exact: true }).click();
    await page.getByRole('button', { name: 'Remove Steam from selection' }).waitFor();
    console.log('PASS: Electron window, sandboxed preload IPC, SQLite seed, website selection.');
  } finally {
    if (app) await app.close();
    // Leave isolated temporary data for inspection; never touch real account data.
    console.log(`Smoke data: ${data}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

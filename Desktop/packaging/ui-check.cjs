const { _electron: electron } = require('playwright-core');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-ui-check-'));
  const app = await electron.launch({ args: [path.resolve(__dirname, '..'), `--user-data-dir=${data}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole('heading', { name: 'Steam Account Manager App', exact: true }).waitFor();
    await page.getByRole('listitem', { name: 'Steam', exact: true }).click();
    await page.getByRole('listitem', { name: 'CSGOEmpire', exact: true }).click();
    await page.getByRole('listitem', { name: 'CSFloat', exact: true }).click();
    fs.mkdirSync(path.resolve(__dirname, '../artifacts'), { recursive: true });
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/dashboard.png') });
    await page.getByRole('button', { name: 'Manage catalog', exact: true }).click();
    await page.screenshot({ path: path.resolve(__dirname, '../artifacts/catalog.png') });
    console.log('UI rendered; captures saved to APP/artifacts.');
  } finally { await app.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

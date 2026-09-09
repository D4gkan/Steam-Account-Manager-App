const { _electron: electron } = require('playwright-core');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-window-test-'));
  const args = [path.resolve(__dirname, '..'), `--user-data-dir=${data}`];
  const app = await electron.launch({ args });
  try {
    const page = await app.firstWindow(); await page.getByRole('heading', { name: 'Steam Account Manager App', exact: true }).waitFor();
    assert(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()));
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()), false);
    const second = spawn(require('electron'), args, { stdio: 'ignore' });
    await new Promise((resolve, reject) => { second.once('exit', resolve); second.once('error', reject); });
    for (let i = 0; i < 50; i++) { if (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible())) break; await new Promise(r => setTimeout(r,100)); }
    assert(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible()), 'Clicking the EXE must show an existing hidden window');
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 1);
    console.log('PASS: initial window visibility and repeat launch reveals hidden dashboard without creating another window.');
  } finally { await app.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

const { chromium } = require('playwright-core');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
(async () => {
  const revision = JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'browsers.json'))).browsers.find(b => b.name === 'chromium').revision;
  const browser = await chromium.launch({ executablePath: path.resolve('resources/runtime', `chromium-${revision}`, process.platform === 'win32' ? 'chrome-win64/chrome.exe' : 'chrome-linux64/chrome'), headless: true, args: ['--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage();
    const png = await require('sharp')({ create: { width: 32, height: 32, channels: 4, background: '#3366aa' } }).png().toBuffer();
    await page.addInitScript(avatar => {
      const account = { id: 'synthetic', steamId64: '76561198012345678', steamName: 'Synthetic account', customLabel: null, avatarCachePath: avatar, onboardingStatus: 'confirmed' };
      window.steamAccountManager = {
        accounts: { list: async () => [account], copyId: async () => {} },
        websites: { list: async () => [] },
        status: async () => ({ setup: 'Ready', messages: {}, browserStates: {} }),
      };
    }, 'data:image/png;base64,' + png.toString('base64'));
    await page.goto(pathToFileURL(path.resolve('dist/renderer/index.html')).href);
    await page.getByText('Synthetic account', { exact: true }).first().waitFor();
    const avatar = page.locator('.account-row img.avatar');
    assert(await avatar.evaluate(img => img.complete && img.naturalWidth === 32));
    await page.getByRole('button', { name: 'Copy SteamID64', exact: true }).click();
    await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Copy SteamID64', exact: true }).waitFor();
    console.log('PASS: cached avatar renders in the dashboard and copy confirmation returns to Copy. Synthetic data only; no screenshots.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

const { chromium } = require('playwright-core');
const { stageExtensions } = require('../dist/main/services/extensions/extensionStager');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-csfloat-check-'));
  const packages = stageExtensions(path.resolve('resources/extensions'), temp);
  const extension = packages.find(p => p.key === 'csfloat-market-checker');
  const expectedId = 'jjicbefpemnphinccgikpdaagjebbnhg';
  const before = process.argv.includes('--expect-missing');
  if (!before) assert.equal(extension.actualId, expectedId);
  const revision = JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'browsers.json'))).browsers.find(b => b.name === 'chromium').revision;
  const executablePath = path.resolve('resources/runtime', `chromium-${revision}`, process.platform === 'win32' ? 'chrome-win64/chrome.exe' : 'chrome-linux64/chrome');
  const context = await chromium.launchPersistentContext(path.join(temp, 'browser'), {
    executablePath, headless: true, ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--disable-extensions-except=${extension.path}`, `--load-extension=${extension.path}`, '--host-resolver-rules=MAP * 127.0.0.1'],
  });
  try {
    await context.route('**/*', route => route.request().url() === 'https://csfloat.com/' ? route.fulfill({ contentType: 'text/html', body: '<title>Synthetic CSFloat connection check</title>' }) : route.abort());
    const page = await context.newPage(); await page.goto('https://csfloat.com/');
    const result = await page.evaluate(id => new Promise(resolve => {
      if (!window.chrome?.runtime?.sendMessage) return resolve({ connected: false });
      chrome.runtime.sendMessage(id, { version: 'CSFLOAT_V1', request_type: 10, request: {}, id: 1 }, response => {
        const failed = !!chrome.runtime.lastError;
        resolve({ connected: !failed && !!response?.response?.version, version: response?.response?.version });
      });
    }), expectedId);
    assert.equal(result.connected, !before);
    if (!before) assert.equal(result.version, extension.version);
    console.log(before ? 'Reproduced: CSFloat website cannot reach the extension under its official ID.' : 'PASS: CSFloat website communicates with the official extension ID and receives the installed version.');
  } finally { await context.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

const { chromium } = require('playwright-core');
const { spawn } = require('node:child_process');
const { stageExtensions } = require('../dist/main/services/extensions/extensionStager');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-fresh-start-'));
  const profile = path.join(temp, 'browser'); fs.mkdirSync(profile); fs.writeFileSync(path.join(profile, '.sam-owner'), 'synthetic');
  const companion = path.join(temp, 'companion'); fs.cpSync(path.resolve('companion-extension'), companion, { recursive: true });
  // Expose the real command dispatcher only inside this synthetic test copy.
  fs.appendFileSync(path.join(companion, 'background.js'), '\nglobalThis.testCommand = command;\n');
  fs.writeFileSync(path.join(companion, 'profile-config.js'), 'export const token = "synthetic-test-token";');
  const extensions = stageExtensions(path.resolve('resources/extensions'), temp).filter(e => ['betterfloat', 'proton-vpn'].includes(e.key));
  const dirs = [...extensions.map(e => e.path), companion];
  const revision = JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'browsers.json'))).browsers.find(b => b.name === 'chromium').revision;
  const executablePath = path.resolve('resources/runtime', `chromium-${revision}`, process.platform === 'win32' ? 'chrome-win64/chrome.exe' : 'chrome-linux64/chrome');
  let context, browser, child;
  const stop = async () => {
    const exited = new Promise(resolve => child.once('exit', resolve));
    const cdp = await browser.newBrowserCDPSession();
    await cdp.send('Browser.close').catch(() => {}); await exited;
    context = null;
  };
  const start = async () => {
    const portFile = path.join(profile, 'DevToolsActivePort'); if (fs.existsSync(portFile)) fs.unlinkSync(portFile);
    child = spawn(executablePath, [`--user-data-dir=${profile}`, '--remote-debugging-port=0', '--headless=new', '--no-sandbox', '--no-startup-window', '--no-first-run', '--disable-background-mode', `--disable-extensions-except=${dirs.join(',')}`, `--load-extension=${dirs.join(',')}`, '--host-resolver-rules=MAP * 127.0.0.1'], { stdio: 'ignore', windowsHide: true });
    for (let i = 0; i < 200 && !fs.existsSync(portFile); i++) await new Promise(r => setTimeout(r, 50));
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    browser = await chromium.connectOverCDP('http://127.0.0.1:' + port); context = browser.contexts()[0];
    await context.route('https://fixture.example/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Synthetic session test</title>' }));
    for (let i = 0; i < 100; i++) {
      for (const worker of context.serviceWorkers()) {
        const name = await worker.evaluate(() => chrome.runtime.getManifest().name).catch(() => '');
        if (name.includes('Companion')) return worker;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    throw Error('Companion did not start');
  };
  const onboardGone = async worker => {
    for (let i = 0; i < 100; i++) {
      const count = await worker.evaluate(async () => (await chrome.tabs.query({})).filter(t => /chrome-extension:\/\/(bphfhlfhnohppnleaehnlfigkkccpglk|jplgfhpmjnbigmhklmmbgecoobifkmpa)\/onboarding\.html/.test(t.pendingUrl || t.url || '')).length);
      if (!count) return; await new Promise(r => setTimeout(r, 50));
    }
    throw Error('Onboarding tab remained open');
  };
  const findPage = async url => {
    for (let i = 0; i < 100; i++) {
      const page = context.pages().find(p => p.url() === url);
      if (page) { await page.waitForLoadState(); return page; }
      await new Promise(r => setTimeout(r, 50));
    }
    throw Error('Requested test page did not open');
  };
  try {
    let worker = await start();
    await worker.evaluate(() => chrome.windows.create({ url: 'https://fixture.example/old-one' }));
    const page = await findPage('https://fixture.example/old-one');
    for (const suffix of ['old-two', 'old-three']) { const tab = await context.newPage(); await tab.goto('https://fixture.example/' + suffix); }
    await context.addCookies([{ name: 'login-fixture', value: 'preserved', domain: 'fixture.example', path: '/', expires: Math.floor(Date.now() / 1000) + 3600, secure: true }]);
    await page.evaluate(() => localStorage.setItem('fixture', 'preserved'));
    await worker.evaluate(async () => {
      const tab = (await chrome.tabs.query({})).find(t => t.url === 'https://fixture.example/old-one');
      await chrome.tabs.update(tab.id, { pinned: true });
      await chrome.storage.local.set({ sessionTest: 'preserved' });
      for (const id of ['bphfhlfhnohppnleaehnlfigkkccpglk', 'jplgfhpmjnbigmhklmmbgecoobifkmpa']) await chrome.tabs.create({ url: `chrome-extension://${id}/onboarding.html` });
    });
    await onboardGone(worker);
    assert.equal((await worker.evaluate(async () => chrome.tabs.query({ url: 'https://fixture.example/*' }))).length, 3);
    await stop();
    // Simulate a profile configured to restore the previous session.
    const prefFile = path.join(profile, 'Default/Preferences');
    const prefs = JSON.parse(fs.readFileSync(prefFile)); prefs.session = { ...prefs.session, restore_on_startup: 1 };
    fs.writeFileSync(prefFile, JSON.stringify(prefs));
    worker = await start();
    await worker.evaluate(() => globalThis.testCommand('start_fresh', { url: 'https://fixture.example/requested' }));
    const fresh = await findPage('https://fixture.example/requested');
    await onboardGone(worker);
    const tabs = await worker.evaluate(async () => (await chrome.tabs.query({})).map(t => t.pendingUrl || t.url));
    assert.deepEqual(tabs, ['https://fixture.example/requested']);
    assert((await context.cookies('https://fixture.example')).some(c => c.name === 'login-fixture' && c.value === 'preserved'));
    assert.equal(await fresh.evaluate(() => localStorage.getItem('fixture')), 'preserved');
    assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get('sessionTest')).sessionTest), 'preserved');
    console.log('PASS: both onboarding pages dismissed; three previous tabs including a pinned tab do not return; exactly one requested tab opens; cookies, local storage and extension settings persist.');
  } finally { if (context) await stop(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

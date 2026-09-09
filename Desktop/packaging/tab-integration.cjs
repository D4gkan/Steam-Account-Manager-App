const { chromium } = require('playwright-core');
const { BrowserManager } = require('../dist/main/services/browser/browserManager');
const { LaunchService } = require('../dist/main/services/launch/launchService');
const { buildMatchConfigFromUrl } = require('../dist/main/domain/validation');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-tab-test-'));
  const a = { id: randomUUID(), profileRelativePath: randomUUID(), onboardingStatus: 'pending_login' };
  const manager = new BrowserManager(data, path.resolve(__dirname, '../resources'), process.execPath, () => [a]);
  let context;
  try {
    await manager.start(); manager.createProfile(a);
    const dirs = manager.extensionPackages().flatMap(p => p.path ? [p.path] : []); dirs.push(manager.companion(a));
    context = await chromium.launchPersistentContext(manager.profile(a), { executablePath: await manager.runtime(), headless: false, ignoreDefaultArgs: ['--disable-extensions'], args: [`--disable-extensions-except=${dirs.join(',')}`, `--load-extension=${dirs.join(',')}`], env: { ...process.env, SAM_BRIDGE_INFO: manager.bridge.infoPath } });
    await manager.bridge.wait(a.id);
    await context.route('https://fixture.example/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Form fixture</title><input id="form" value="original">' }));
    const form = await context.newPage(); await form.goto('https://fixture.example/form'); await form.locator('#form').fill('Unsaved form state');
    const other = await context.newPage(); await other.goto('https://fixture.example/unrelated');
    const worker = context.serviceWorkers().find(w => w.url().startsWith(`chrome-extension://${manager.extensionId}/`)) || await context.waitForEvent('serviceworker', w => w.url().startsWith(`chrome-extension://${manager.extensionId}/`));
    const setup = await worker.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const form = tabs.find(t => t.url === 'https://fixture.example/form'), other = tabs.find(t => t.url === 'https://fixture.example/unrelated');
      await chrome.tabs.update(form.id, { pinned: true }); await chrome.tabs.update(other.id, { pinned: true });
      const extra = await chrome.windows.create({ url: 'https://fixture.example/extra' });
      return { form: form.id, other: other.id, primary: form.windowId, extra: extra.id };
    });
    // Track the original primary window explicitly, then move a requested tab from another window.
    await worker.evaluate(async primary => chrome.storage.session.set({ primaryWindow: primary }), setup.primary);
    const websites = ['https://fixture.example/extra', 'https://fixture.example/form'].map(url => ({ id: randomUUID(), launchUrl: url, matchConfig: buildMatchConfigFromUrl(url) }));
    for (let i = 0; i < 50; i++) { const snapshot = await manager.bridge.request(a.id, 'list_tabs'); if (snapshot.tabs.some(t => t.url === 'https://fixture.example/extra')) break; await new Promise(r => setTimeout(r, 50)); } const result = await new LaunchService(manager).forAccount(a, websites); assert.equal(result.error, null); assert.equal(result.reusedTabs.length, 2);
    assert.equal(await form.locator('#form').inputValue(), 'Unsaved form state');
    const tabs = await manager.bridge.request(a.id, 'list_tabs'); const primaryTabs = tabs.tabs.filter(t => t.windowId === setup.primary);
    assert.deepEqual(primaryTabs.slice(0,2).map(t => t.url), websites.map(w => w.launchUrl)); assert(primaryTabs.every(t => !t.pinned));
    assert(primaryTabs.some(t => t.tabId === setup.other));
    assert(await worker.evaluate(async id => (await chrome.windows.getAll()).some(w => w.id === id), setup.extra), 'User-created source window must remain open');
    // Synthetic Steam fixtures exercise the actual content script without logging in.
    const own = '76561198022222222', subject = '76561198011111111';
    const signals = []; manager.bridge.onIdentity = (_id, s) => signals.push(s);
    await context.route('https://steamcommunity.com/**', route => {
      const isOwn = route.request().url().includes(own);
      return route.fulfill({ contentType: 'text/html', body: isOwn ? `<span class="actual_persona_name">Own account</span><script>var g_rgProfileData = {"steamid":"${own}"};</script>` : `<div id="global_header"><div id="global_actions"><span id="account_pulldown">Signed in</span><a class="user_avatar" href="https://steamcommunity.com/profiles/${own}/">Own profile</a></div></div><span class="actual_persona_name">Someone else</span><script>var g_rgProfileData = {"steamid":"${subject}"};</script>` });
    });
    const steam = await context.newPage(); await steam.goto(`https://steamcommunity.com/profiles/${subject}/`);
    for (let i = 0; i < 50 && !signals.some(s => s.ownProfile); i++) await new Promise(r => setTimeout(r, 100));
    assert(signals.some(s => s.ownProfile?.steamId64 === own)); assert(!signals.some(s => s.ownProfile?.steamId64 === subject));
    console.log('PASS real Chromium: pinned tab ordering, cross-window reuse, unsaved form preservation; actual identity content script against synthetic own/other Steam fixtures.');
  } finally { if (context) await context.close(); manager.bridge.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });



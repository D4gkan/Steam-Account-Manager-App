const { fork } = require('node:child_process');
const { createServer } = require('node:http');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { buildMatchConfigFromUrl } = require('../dist/main/domain/validation');
(async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'sam-lifecycle-test-'));
  const accounts = [0,1].map(() => ({ id: randomUUID(), profileRelativePath: randomUUID(), onboardingStatus: 'pending_login' }));
  fs.writeFileSync(path.join(data, 'test-accounts.json'), JSON.stringify(accounts));
  const requests = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture');
    requests.push({ path: url.pathname, query: url.search, cookie: req.headers.cookie || '' });
    if (url.pathname === '/seed') res.setHeader('Set-Cookie', `fixture=${url.searchParams.get('value')}; Path=/; Max-Age=86400; SameSite=Lax`);
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>Account isolation fixture</title><input value="Preserve this form"><h1>Local browser test fixture</h1>');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let worker;
  const start = async () => {
    worker = fork(path.join(__dirname, 'browser-test-worker.cjs'), [data], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
    await new Promise((resolve, reject) => { worker.once('message', msg => msg.ready ? resolve() : reject(Error(msg.error))); worker.once('error', reject); });
  };
  let sequence = 0;
  const send = (action, extra = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { worker.off('message', receive); reject(Error('Proof command timed out')); }, 60000);
    const receive = msg => { if (msg.id !== id) return; clearTimeout(timer); worker.off('message', receive); msg.error ? reject(Error(msg.error)) : resolve(msg.result); };
    worker.on('message', receive); worker.send({ id, action, ...extra });
  });
  const website = url => ({ id: randomUUID(), launchUrl: url, matchConfig: buildMatchConfigFromUrl(url) });
  try {
    await start();
    await send('ensure', { account: 0, url: `${origin}/seed?value=A` });
    await send('ensure', { account: 1, url: `${origin}/seed?value=B` });
    const sites = [website(`${origin}/one`), website(`${origin}/two`)];
    for (const account of [0,1]) {
      const result = await send('launch', { account, sites }); assert.equal(result.error, null);
      const snapshot = await send('tabs', { account });
      assert.deepEqual(snapshot.tabs.filter(t => t.windowId === snapshot.primaryWindow).slice(0,2).map(t => t.url), sites.map(s => s.launchUrl));
    }
    const before = await send('tabs', { account: 0 });
    const result = await send('launch', { account: 0, sites: [...sites].reverse() });
    assert.equal(result.reusedTabs.length, 2); assert.equal(result.openedTabs.length, 0);
    const after = await send('tabs', { account: 0 });
    assert.deepEqual(after.tabs.slice(0,2).map(t => t.tabId), before.tabs.slice(0,2).map(t => t.tabId).reverse());
    const exit = new Promise(r => worker.once('exit', r)); await send('exit'); await exit;
    await start();
    const reconnected = await send('tabs', { account: 0 });
    assert.deepEqual(reconnected.tabs.map(t => t.tabId), after.tabs.map(t => t.tabId));
    for (const account of [0,1]) await send('launch', { account, sites: [website(`${origin}/check?account=${account}`)] });
    await new Promise(r => setTimeout(r, 1200));
    assert(requests.some(r => r.path === '/check' && r.query === '?account=0' && r.cookie === 'fixture=A'));
    assert(requests.some(r => r.path === '/check' && r.query === '?account=1' && r.cookie === 'fixture=B'));
    assert.equal(requests.filter(r => r.path === '/one').length, 2, 'Reuse must not reload the original pages');
    // Close and reopen one browser, proving browser-managed cookie persistence.
    await send('close', { account: 0 }); await new Promise(r => setTimeout(r, 2000));
    await send('ensure', { account: 0, url: `${origin}/restart` }); await new Promise(r => setTimeout(r, 1000));
    assert(requests.some(r => r.path === '/restart' && r.cookie === 'fixture=A'), JSON.stringify(requests));
    console.log('PASS: two isolated profiles, exact ordering, no reload on reuse, actual manager process exit/reconnect, browser restart cookie persistence.');
  } finally {
    if (worker?.connected) { for (const account of [0,1]) await send('close', { account }).catch(() => {}); await send('exit').catch(() => {}); }
    server.close(); console.log('Isolated test data:', data);
  }
})().catch(e => { console.error(e); process.exitCode = 1; });


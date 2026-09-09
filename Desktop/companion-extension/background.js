import { token } from './profile-config.js';
import { suppressOnboarding } from './tab-policy.js';
suppressOnboarding(chrome);
let port = null;
let retry;
function connect() {
  if (port) return;
  try {
    port = chrome.runtime.connectNative('com.steamaccountmanager.bridge');
    port.onDisconnect.addListener(() => { void chrome.runtime.lastError; port = null; clearTimeout(retry); retry = setTimeout(connect, 3000); });
    port.onMessage.addListener(async msg => {
      if (!msg || typeof msg.id !== 'string') return;
      const current = port;
      try { current?.postMessage({ id: msg.id, ok: true, result: await command(msg.command, msg.payload || {}) }); }
      catch (e) { try { current?.postMessage({ id: msg.id, ok: false, error: String(e.message || e) }); } catch {} }
    });
    port.postMessage({ type: 'hello', token });
  } catch { port = null; }
}
const integer = value => { if (!Number.isInteger(value) || value < 0) throw Error('Invalid browser identifier'); return value; };
const safeUrl = value => { const u = new URL(value); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw Error('Invalid launch URL'); return u.href; };
async function normalWindows() { return (await chrome.windows.getAll({ windowTypes: ['normal'] })).filter(w => !w.incognito); }
async function verifyWindow(id) { integer(id); if (!(await normalWindows()).some(w => w.id === id)) throw Error('Window is not a normal account window'); }
async function verifyTab(id) { const t = await chrome.tabs.get(integer(id)); if (t.incognito) throw Error('Incognito tabs are excluded'); await verifyWindow(t.windowId); return t; }
async function command(name, p) {
  switch (name) {
    case 'start_fresh': {
      const url = safeUrl(p.url);
      const window = await chrome.windows.create({ url, focused: true });
      const tabId = window.tabs[0].id;
      await chrome.storage.session.set({ primaryWindow: window.id });
      // Chromium can restore pinned/session tabs when the first window opens,
      // even with --no-startup-window. This command is used only on cold launch.
      // Drain those startup tabs while restoration settles; keep the requested
      // tab by ID and preserve incognito windows.
      let quiet = 0;
      for (let attempt = 0; attempt < 20 && quiet < 4; attempt++) {
        const windows = await normalWindows();
        const extra = (await chrome.tabs.query({})).filter(t => t.id !== tabId && !t.incognito && windows.some(w => w.id === t.windowId));
        if (extra.length) {
          quiet = 0;
          for (const tab of extra) await chrome.tabs.remove(tab.id).catch(() => {});
        } else quiet++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { tabId, windowId: window.id };
    }
    case 'list_tabs': {
      const windows = await normalWindows();
      const tabs = (await chrome.tabs.query({})).filter(t => windows.some(w => w.id === t.windowId) && !t.incognito);
      const saved = await chrome.storage.session.get('primaryWindow');
      const primaryWindow = windows.some(w => w.id === saved.primaryWindow) ? saved.primaryWindow : windows.map(w => w.id).sort((a,b) => a-b)[0];
      if (primaryWindow !== undefined) await chrome.storage.session.set({ primaryWindow });
      return { primaryWindow, tabs: tabs.map(t => ({ tabId: t.id, windowId: t.windowId, url: t.pendingUrl || t.url || '', pinned: t.pinned, index: t.index })) };
    }
    case 'create_tab': {
      const url = safeUrl(p.url);
      if (p.windowId === undefined) { const w = await chrome.windows.create({ url, focused: true }); await chrome.storage.session.set({ primaryWindow: w.id }); return { tabId: w.tabs[0].id, windowId: w.id }; }
      await verifyWindow(p.windowId);
      const t = await chrome.tabs.create({ windowId: p.windowId, url, active: false }); return { tabId: t.id, windowId: t.windowId };
    }
    case 'arrange_tabs': {
      await verifyWindow(p.windowId);
      if (!Array.isArray(p.tabIds) || !p.tabIds.length || new Set(p.tabIds).size !== p.tabIds.length || p.tabIds.length > 100) throw Error('Invalid tab order');
      for (const id of p.tabIds) await verifyTab(id);
      // Moving the last tab out would make Chromium close a user-created window.
      // Leave a blank tab there so the window itself survives the move.
      const sources = new Set();
      for (const id of p.tabIds) { const tab = await chrome.tabs.get(id); if (tab.windowId !== p.windowId) sources.add(tab.windowId); }
      for (const windowId of sources) {
        const sourceTabs = await chrome.tabs.query({ windowId });
        if (sourceTabs.every(t => p.tabIds.includes(t.id))) await chrome.tabs.create({ windowId, url: 'about:blank', active: false });
      }
      // Exact ordering requires unpinning requested tabs AND unrelated pinned tabs.
      // Unrelated tabs keep their relative order; the UI documents this behavior.
      const existing = (await chrome.tabs.query({ windowId: p.windowId })).sort((a,b) => a.index-b.index);
      for (const t of existing) if (t.pinned) await chrome.tabs.update(t.id, { pinned: false });
      for (const id of p.tabIds) { await chrome.tabs.update(id, { pinned: false }); }
      for (let index = 0; index < p.tabIds.length; index++) await chrome.tabs.move(p.tabIds[index], { windowId: p.windowId, index });
      await chrome.tabs.update(p.tabIds[0], { active: true });
      let focused = true; try { await chrome.windows.update(p.windowId, { focused: true }); } catch { focused = false; }
      return { focused };
    }
    case 'close_windows': for (const w of await normalWindows()) await chrome.windows.remove(w.id); return true;
    case 'extensions': return (await chrome.management.getAll()).filter(e => e.type === 'extension').map(e => ({ id: e.id, name: e.name, version: e.version, enabled: e.enabled, installType: e.installType }));
    case 'detect_identity': {
      const tabs = await chrome.tabs.query({ url: ['https://steamcommunity.com/*', 'https://store.steampowered.com/*'] });
      for (const t of tabs.filter(t => !t.incognito)) { try { await chrome.tabs.sendMessage(t.id, { type: 'detect-identity' }); } catch {} }
      return { requested: tabs.length };
    }
    default: throw Error('Disallowed command');
  }
}
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== 'steam-identity-signal' || !sender.tab || sender.tab.incognito) return;
  try { const u = new URL(sender.url); if (u.protocol !== 'https:' || !['steamcommunity.com', 'store.steampowered.com'].includes(u.hostname)) return; } catch { return; }
  connect(); try { port?.postMessage({ command: 'identity_signal', payload: { ...msg.signals, url: sender.url } }); } catch {}
});
chrome.alarms.create('reconnect', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(connect);
chrome.runtime.onStartup.addListener(connect);
chrome.runtime.onInstalled.addListener(connect);
connect();


// Read only Steam's authenticated header own-profile navigation. Never derive identity
// from the subject of an arbitrary profile currently displayed in the tab.
(async () => {
  let running = false;
  async function detect() {
    if (running) return; running = true;
    try {
      const link = document.querySelector('#global_actions a.user_avatar, #global_header a.user_avatar');
      const menu = document.querySelector('#account_pulldown');
      if (!menu || !link) { await chrome.runtime.sendMessage({ type: 'steam-identity-signal', signals: { isAuthenticated: false, ownProfile: null } }); return; }
      const ownUrl = new URL(link.href);
      if (ownUrl.protocol !== 'https:' || ownUrl.hostname !== 'steamcommunity.com' || !/^\/(id|profiles)\/[^/]+\/?$/.test(ownUrl.pathname)) return;
      const response = await fetch(ownUrl.href, { credentials: 'include', signal: AbortSignal.timeout(10000) });
      if (!response.ok || new URL(response.url).hostname !== 'steamcommunity.com') throw Error('Own profile unavailable');
      const html = await response.text(); if (html.length > 3 * 1024 * 1024) throw Error('Page too large');
      const documentOwn = new DOMParser().parseFromString(html, 'text/html');
      const json = html.match(/g_rgProfileData\s*=\s*(\{[^;]+\})\s*;/);
      const data = json ? JSON.parse(json[1]) : null;
      const steamId64 = data?.steamid;
      const personaName = documentOwn.querySelector('.actual_persona_name')?.textContent?.trim();
      // The main process fetches the identity-checked account avatar field.
      // Never infer avatar ownership from generic images on a profile page.
      const avatarUrl = null;
      if (typeof steamId64 !== 'string' || !/^7656119\d{10}$/.test(steamId64) || !personaName) throw Error('Steam own-profile markup changed');
      await chrome.runtime.sendMessage({ type: 'steam-identity-signal', signals: { isAuthenticated: true, ownProfile: { steamId64, personaName, avatarUrl } } });
    } catch { await chrome.runtime.sendMessage({ type: 'steam-identity-signal', signals: { isAuthenticated: true, ownProfile: null } }).catch(() => {}); }
    finally { running = false; }
  }
  chrome.runtime.onMessage.addListener(msg => { if (msg?.type === 'detect-identity') void detect(); });
  await detect();
})();

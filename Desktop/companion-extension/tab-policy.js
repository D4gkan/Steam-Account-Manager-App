export function isUnwantedOnboarding(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'chrome-extension:' &&
      ['bphfhlfhnohppnleaehnlfigkkccpglk', 'jplgfhpmjnbigmhklmmbgecoobifkmpa'].includes(url.hostname) &&
      url.pathname === '/onboarding.html';
  } catch { return false; }
}

export function suppressOnboarding(chrome) {
  const dismiss = async tab => {
    if (tab.incognito || !isUnwantedOnboarding(tab.pendingUrl || tab.url)) return;
    try {
      // Recheck so a tab that has since navigated somewhere else is retained.
      const current = await chrome.tabs.get(tab.id);
      if (!current.incognito && isUnwantedOnboarding(current.pendingUrl || current.url)) await chrome.tabs.remove(tab.id);
    } catch { /* The tab may already have closed. */ }
  };
  const sweep = async () => { for (const tab of await chrome.tabs.query({})) await dismiss(tab); };
  chrome.tabs.onCreated.addListener(tab => { void dismiss(tab); });
  chrome.tabs.onUpdated.addListener((_id, _change, tab) => { void dismiss(tab); });
  chrome.runtime.onStartup.addListener(() => { void sweep(); });
  chrome.runtime.onInstalled.addListener(() => { void sweep(); });
  void sweep();
}

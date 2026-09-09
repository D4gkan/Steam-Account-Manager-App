import { Account, AccountLaunchResult, Website } from '../../domain/types';
import { BrowserManager } from '../browser/browserManager';
import { LiveTab, matchRequestedWebsites } from './tabMatcher';

export class LaunchService {
  private queues = new Map<string, Promise<unknown>>();
  private associations = new Map<string, Map<number, string>>();
  constructor(private browsers: BrowserManager, private catalog?: () => Website[]) {}
  forAccount(account: Account, websites: Website[]): Promise<AccountLaunchResult> {
    const previous = this.queues.get(account.id) || Promise.resolve();
    const next = previous.catch(() => {}).then(() => this.execute(account, websites));
    this.queues.set(account.id, next);
    void next.finally(() => { if (this.queues.get(account.id) === next) this.queues.delete(account.id); });
    return next;
  }
  async all(accounts: Account[], websites: Website[]) {
    const results: AccountLaunchResult[] = new Array(accounts.length);
    let index = 0;
    await Promise.all(Array.from({ length: Math.min(2, accounts.length) }, async () => {
      while (index < accounts.length) { const i = index++; results[i] = await this.forAccount(accounts[i], websites); }
    }));
    return results;
  }
  private async execute(account: Account, websites: Website[]): Promise<AccountLaunchResult> {
    const result: AccountLaunchResult = { accountId: account.id, browserState: 'open', openedTabs: [], reusedTabs: [], failedWebsites: [], error: null };
    try {
      if (account.onboardingStatus === 'mismatched') throw Error('Resolve the Steam identity mismatch before launching websites.');
      const fresh = !this.browsers.bridge.connected(account.id);
      await this.browsers.ensure(account, fresh ? websites[0]?.launchUrl : undefined);
      const observed = await this.browsers.bridge.request<{ primaryWindow?: number; tabs: LiveTab[] }>(account.id, 'list_tabs');
      let windowId = observed.primaryWindow;
      const associations = this.associations.get(account.id) || new Map<number, string>();
      this.associations.set(account.id, associations);
      for (const tabId of associations.keys()) if (!observed.tabs.some(t => t.tabId === tabId)) associations.delete(tabId);
      const matches = matchRequestedWebsites(websites.map(w => ({ websiteId: w.id, matchConfig: w.matchConfig })), observed.tabs,
        (this.catalog?.() || websites).map(w => ({ websiteId: w.id, matchConfig: w.matchConfig })), associations);
      const requested: number[] = [];
      for (let i = 0; i < websites.length; i++) {
        const website = websites[i], match = matches[i].match;
        if (match) { requested.push(match.tabId); associations.set(match.tabId, website.id); result.reusedTabs.push(website.id); continue; }
        try {
          const created = await this.browsers.bridge.request(account.id, 'create_tab', { windowId, url: website.launchUrl });
          windowId = created.windowId; requested.push(created.tabId); result.openedTabs.push(website.id);
          associations.set(created.tabId, website.id);
        } catch (e) { result.failedWebsites.push({ websiteId: website.id, reason: (e as Error).message }); }
      }
      if (requested.length) await this.browsers.bridge.request(account.id, 'arrange_tabs', { windowId, tabIds: requested });
      else result.error = 'No requested tabs could be opened.';
    } catch (e) { result.browserState = 'unavailable'; result.error = (e as Error).message; }
    return result;
  }
}

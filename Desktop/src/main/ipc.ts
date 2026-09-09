import { ipcMain, dialog, BrowserWindow, clipboard } from 'electron';
import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AccountRepository } from '../persistence/repositories/accountRepository';
import { WebsiteRepository } from '../persistence/repositories/websiteRepository';
import { isSafeLaunchUrl, isManagedProfileSegment } from '../domain/validation';
import { BrowserManager } from '../services/browser/browserManager';
import { LaunchService } from '../services/launch/launchService';
import { AccountOnboardingService } from '../services/accounts/accountService';
import { inspectAllExtensions } from '../services/extensions/extensionProvisioner';
import { cacheImage, fetchWebsiteIcon, ICON_ERROR } from '../services/icons/iconFetcher';
import { fetchSteamAvatar } from '../services/metadata/steamAvatar';
import { ExtensionRepository } from '../persistence/repositories/extensionRepository';
export interface IpcContext { db: Database.Database; userDataDir: string; browsers: BrowserManager; resources: string; }
export function registerIpcHandlers(ctx: IpcContext): void {
  const accounts = new AccountRepository(ctx.db), websites = new WebsiteRepository(ctx.db);
  const launches = new LaunchService(ctx.browsers, () => websites.listAll()), onboarding = new AccountOnboardingService(accounts);
  const extensionRepository = new ExtensionRepository(ctx.db);
  const cacheDir = path.join(ctx.userDataDir, 'cache');
  const messages: Record<string, string> = {};
  const icons = new Map<string, Promise<unknown>>();
  const avatarJobs = new Map<string, Promise<void>>();
  const avatarChecked = new Map<string, number>();
  const refreshAvatar = (accountId: string, force = false): Promise<void> => {
    const current = avatarJobs.get(accountId); if (current) return current;
    if (!force && Date.now() - (avatarChecked.get(accountId) || 0) < 5 * 60 * 1000) return Promise.resolve();
    const a = accounts.findById(accountId); if (!a?.steamId64) return Promise.resolve();
    avatarChecked.set(accountId, Date.now());
    const job = (async () => {
      try {
        const cached = await fetchSteamAvatar(a.steamId64!, cacheDir);
        const latest = accounts.findById(a.id);
        // Refresh only the stored identity's picture; never change login/mismatch status.
        if (latest?.steamId64 === a.steamId64) accounts.refreshMetadata(a.id, latest.steamName || '', cached);
      } catch { /* Keep the previous image; the next refresh can retry. */ }
    })().finally(() => avatarJobs.delete(accountId));
    avatarJobs.set(accountId, job); return job;
  };
  const image = (file: string | null) => {
    if (!file || !path.resolve(file).startsWith(path.resolve(cacheDir) + path.sep)) return null;
    try { return 'data:image/png;base64,' + fs.readFileSync(file).toString('base64'); } catch { return null; }
  };
  const listAccounts = () => accounts.listAll().map(a => {
    void refreshAvatar(a.id);
    return { ...a, avatarCachePath: image(a.avatarCachePath) };
  });
  const listWebsites = () => websites.listAll().map(w => ({ ...w, iconCachePath: image(w.iconCachePath) }));
  const id = (value: unknown) => { if (typeof value !== 'string' || !isManagedProfileSegment(value)) throw Error('Invalid identifier'); return value; };
  const account = (value: unknown) => { const a = accounts.findById(id(value)); if (!a) throw Error('Account not found'); return a; };
  const text = (value: unknown, max = 200) => { if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error('Invalid text'); return value.trim(); };
  const websiteValues = (name: unknown, url: unknown) => { const n = text(name), u = text(url, 8192); if (!isSafeLaunchUrl(u)) throw Error('Use an HTTP or HTTPS URL without credentials'); return [n, u]; };
  const handle = (channel: string, fn: (...args: any[]) => any) => ipcMain.handle(channel, (event, ...args) => {
    if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame || !BrowserWindow.fromWebContents(event.sender)) throw Error('Untrusted IPC sender');
    const url = event.senderFrame.url;
    if (!url.startsWith('file:')) throw Error('Only the local dashboard can call this action');
    return fn(...args);
  });
  const fetchIcon = async (websiteId: string) => {
    if (icons.has(websiteId)) return icons.get(websiteId);
    const job = (async () => {
      const w = websites.findById(websiteId); if (!w) throw Error('Website not found');
      const result = await fetchWebsiteIcon(w.launchUrl, cacheDir);
      if (result.ok) websites.updateIcon(w.id, result.cachePath, result.source);
      return result.ok ? { ok: true } : result;
    })();
    icons.set(websiteId, job); try { return await job; } finally { icons.delete(websiteId); }
  };
  ctx.browsers.bridge.onIdentity = (accountId, signals) => {
    void (async () => {
      const a = accounts.findById(accountId); if (!a) return;
      const result = a.steamId64 ? onboarding.checkOngoingIdentity(a.id, signals) : onboarding.handleOnboardingSignal(a.id, signals, null);
      messages[a.id] = result.kind === 'duplicate' ? 'This Steam identity already belongs to another account. Use that account; profiles are never merged.' : result.kind === 'mismatch' ? 'Steam identity mismatch. Log back into the expected Steam account, then retry detection.' : result.kind === 'detection_failed' ? 'Open your own Steam profile from the Steam account menu, then retry detection.' : result.kind === 'not_authenticated' ? 'Complete Steam login manually in this account browser.' : '';
      if (result.kind === 'match') ctx.db.prepare("UPDATE accounts SET onboarding_status = 'confirmed' WHERE id = ?").run(a.id);
      if (['confirmed', 'match'].includes(result.kind)) await refreshAvatar(a.id, result.kind === 'confirmed');
    })().catch(() => { messages[accountId] = 'Identity detection failed. Open your own Steam profile and retry.'; });
  };
  handle('accounts:list', listAccounts);
  handle('accounts:create-pending', async () => { const a = accounts.createPending(); ctx.browsers.createProfile(a); try { await ctx.browsers.ensure(a, 'https://store.steampowered.com/login/'); } catch (e) { messages[a.id] = (e as Error).message; } return a; });
  handle('accounts:retry', async value => {
    const a = account(value); void refreshAvatar(a.id, true); await ctx.browsers.ensure(a, 'https://steamcommunity.com/my/');
    const detected = await ctx.browsers.bridge.request(a.id, 'detect_identity');
    if (!detected.requested) await ctx.browsers.bridge.request(a.id, 'create_tab', { url: 'https://steamcommunity.com/my/' });
  });
  handle('accounts:set-custom-label', (value, label) => { const a = account(value); accounts.setCustomLabel(a.id, label === null || label === '' ? null : text(label)); });
  handle('accounts:delete', async value => {
    const a = account(value);
    const result = await dialog.showMessageBox({ type: 'warning', title: 'Delete local account data?', message: `Delete ${a.customLabel || a.steamName || 'pending account'}?`, detail: 'This permanently removes this account’s local website sessions and browser data. It does not delete the real Steam account. Close its browser first.', buttons: ['Cancel', 'Delete local data'], defaultId: 0, cancelId: 0, noLink: true });
    if (result.response !== 1) return false;
    await ctx.browsers.deleteAccount(a);
    try { accounts.delete(a.id); } catch { throw Error('Local profile data was removed, but the database record could not be deleted. Retry deletion to remove the remaining record.'); }
    return true;
  });
  handle('accounts:copy-id', value => { const a = account(value); if (a.steamId64) clipboard.writeText(a.steamId64); });
  handle('websites:list', listWebsites);
  handle('websites:add', (name, url) => { const [n, u] = websiteValues(name, url); const w = websites.add(n, u); return w; });
  handle('websites:edit', (value, name, url) => { const [n, u] = websiteValues(name, url); websites.edit(id(value), n, u); });
  handle('websites:reorder', values => { if (!Array.isArray(values) || values.length > 1000) throw Error('Invalid catalog order'); websites.reorder(values.map(id)); });
  handle('websites:remove', value => websites.remove(id(value)));
  handle('websites:fetch-icon', value => fetchIcon(id(value)));
  handle('websites:upload-icon', async value => {
    const websiteId = id(value); if (!websites.findById(websiteId)) throw Error('Website not found');
    const chosen = await dialog.showOpenDialog({ title: 'Upload PNG', filters: [{ name: 'PNG image', extensions: ['png'] }], properties: ['openFile'] });
    if (chosen.canceled) return false;
    if (fs.statSync(chosen.filePaths[0]).size > 2 * 1024 * 1024) throw Error('PNG exceeds 2 MB');
    const cached = await cacheImage(fs.readFileSync(chosen.filePaths[0]), cacheDir, true); websites.updateIcon(websiteId, cached, 'user-upload'); return true;
  });
  let launchBusy = false;
  handle('launch:open-selected', async request => {
    if (launchBusy) throw Error('A launch is already in progress');
    if (!request || !Array.isArray(request.accountIds) || !Array.isArray(request.orderedWebsiteIds) || request.accountIds.length < 1 || request.accountIds.length > 20 || request.orderedWebsiteIds.length < 1 || request.orderedWebsiteIds.length > 100) throw Error('Select 1–20 accounts and 1–100 websites');
    if (new Set(request.accountIds).size !== request.accountIds.length || new Set(request.orderedWebsiteIds).size !== request.orderedWebsiteIds.length) throw Error('Duplicate launch targets');
    const targets = request.accountIds.map(account);
    const sites = request.orderedWebsiteIds.map((value: unknown) => { const w = websites.findById(id(value)); if (!w) throw Error('Website no longer exists'); return w; });
    launchBusy = true; try { return await launches.all(targets, sites); } finally { launchBusy = false; }
  });
  handle('diagnostics:status', () => ({ setup: ctx.browsers.setupStatus, messages, browserStates: Object.fromEntries(accounts.listAll().map(a => [a.id, ctx.browsers.state(a.id)])) }));
  handle('diagnostics:extensions', async value => {
    const a = account(value); const packages = ctx.browsers.extensionPackages();
    const live = ctx.browsers.bridge.connected(a.id) ? await ctx.browsers.bridge.request<any[]>(a.id, 'extensions') : [];
    return packages.map(p => {
      const runtime = live.filter(e => e.id === p.actualId && e.version === p.version && e.enabled);
      extensionRepository.upsertPackage(p);
      extensionRepository.setAccountExtensionStatus({ accountId: a.id, extensionKey: p.key, installedVersion: runtime.length ? p.version : null, verifiedAt: null, status: runtime.length ? 'installed' : p.compatibilityStatus === 'installed' ? 'pending' : p.compatibilityStatus, errorCode: runtime.length ? 'FUNCTIONAL_VERIFICATION_PENDING' : 'NOT_OBSERVED' });
      return { ...p, runtime, note: 'Static package inspection; a loaded extension is not proof of authenticated site functionality.' };
    });
  });
}

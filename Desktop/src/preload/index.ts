import { contextBridge, ipcRenderer } from "electron";
import { Account, Website, WebsiteId, AccountId, LaunchRequest, AccountLaunchResult, BrowserState } from "../domain/types";

/**
 * The only surface the renderer can reach. No generic `invoke(channel, ...)`
 * passthrough is exposed -- each method here maps to exactly one fixed IPC
 * channel, so a compromised/malicious renderer script cannot invent new
 * channel names to reach unintended main-process behavior.
 */
const api = {
  accounts: {
    retry: (id: string): Promise<void> => ipcRenderer.invoke('accounts:retry', id),
    copyId: (id: string): Promise<void> => ipcRenderer.invoke('accounts:copy-id', id),
    list: (): Promise<Account[]> => ipcRenderer.invoke("accounts:list"),
    createPending: (): Promise<Account> => ipcRenderer.invoke("accounts:create-pending"),
    setCustomLabel: (accountId: AccountId, label: string | null): Promise<void> =>
      ipcRenderer.invoke("accounts:set-custom-label", accountId, label),
    delete: (accountId: AccountId): Promise<void> => ipcRenderer.invoke("accounts:delete", accountId),
  },
  websites: {
    edit: (id: string, name: string, url: string): Promise<void> => ipcRenderer.invoke('websites:edit', id, name, url),
    fetchIcon: (id: string): Promise<{ ok: boolean; reason?: string }> => ipcRenderer.invoke('websites:fetch-icon', id),
    uploadIcon: (id: string): Promise<boolean> => ipcRenderer.invoke('websites:upload-icon', id),
    list: (): Promise<Website[]> => ipcRenderer.invoke("websites:list"),
    add: (displayName: string, launchUrl: string): Promise<Website> =>
      ipcRenderer.invoke("websites:add", displayName, launchUrl),
    reorder: (orderedIds: WebsiteId[]): Promise<void> => ipcRenderer.invoke("websites:reorder", orderedIds),
    remove: (websiteId: WebsiteId): Promise<void> => ipcRenderer.invoke("websites:remove", websiteId),
  },
  launch: (request: LaunchRequest): Promise<AccountLaunchResult[]> => ipcRenderer.invoke('launch:open-selected', request),
  status: (): Promise<{ setup: string; messages: Record<string, string>; browserStates: Record<string, BrowserState> }> => ipcRenderer.invoke('diagnostics:status'),
  extensions: (id: string): Promise<any[]> => ipcRenderer.invoke('diagnostics:extensions', id),
};

export type SteamAccountManagerApi = typeof api;

contextBridge.exposeInMainWorld("steamAccountManager", api);

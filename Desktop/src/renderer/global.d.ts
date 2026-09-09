import type { SteamAccountManagerApi } from "../preload/index";

declare global {
  interface Window {
    steamAccountManager: SteamAccountManagerApi;
  }
}

export {};

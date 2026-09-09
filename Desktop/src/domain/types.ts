/**
 * Domain types. SteamID64 is always a string (TEXT) end-to-end -- never a
 * number -- to avoid JS float precision loss on 64-bit Steam identifiers.
 */

export type AccountId = string; // UUID
export type WebsiteId = string; // UUID
export type OnboardingStatus =
  | "pending_login"
  | "pending_detection"
  | "confirmed"
  | "detection_failed"
  | "mismatched";

export interface Account {
  id: AccountId;
  steamId64: string | null; // TEXT, nullable until confirmed
  steamName: string | null;
  customLabel: string | null;
  avatarCachePath: string | null;
  profileRelativePath: string; // UUID-based, stable even if label changes
  onboardingStatus: OnboardingStatus;
  createdAt: string; // ISO 8601
  metadataUpdatedAt: string | null;
}

export type IconSource = "fetched" | "favicon-fallback" | "user-upload" | "none";

export interface Website {
  id: WebsiteId;
  displayName: string;
  launchUrl: string;
  matchConfig: WebsiteMatchConfig;
  iconCachePath: string | null;
  iconSource: IconSource;
  catalogPosition: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Deterministic tab-matching configuration for a website. Matching is by
 * normalized origin + optional path/query rules -- never by title,
 * substring, or bare registrable domain (see tabMatcher.ts).
 */
export interface WebsiteMatchConfig {
  origin: string; // normalized scheme://host[:port]
  pathMode: "any" | "prefix" | "exact";
  path?: string; // required when pathMode is "prefix" or "exact"
  preserveQuery: boolean;
  query?: string;
}

export type ExtensionKey =
  | "betterfloat"
  | "csmoney"
  | "cs2-trader"
  | "csfloat-market-checker"
  | "proton-vpn"
  | "skinscom"
  | "trade-token-sync"
  | "csgoempire-quick-buy";

export type ExtensionStatus =
  | "pending"
  | "installed"
  | "verified"
  | "failed"
  | "incompatible";

export interface ExtensionPackage {
  key: ExtensionKey;
  expectedLegacyId: string | null;
  actualId: string | null;
  version: string | null;
  source: "publisher-package" | "supplied-custom-folder";
  digest: string | null; // sha256 of packaged assets, for provenance
  packageRelativePath: string;
  compatibilityStatus: ExtensionStatus;
}

export interface AccountExtensionStatus {
  accountId: AccountId;
  extensionKey: ExtensionKey;
  installedVersion: string | null;
  verifiedAt: string | null;
  status: ExtensionStatus;
  errorCode: string | null;
}

/** A single ordered launch request, built transiently in the renderer. */
export interface LaunchRequest {
  accountIds: AccountId[];
  orderedWebsiteIds: WebsiteId[]; // click order, not catalog order
}

export type BrowserState = "starting" | "open" | "closed" | "unavailable" | "unknown";

export interface AccountLaunchResult {
  accountId: AccountId;
  browserState: BrowserState;
  openedTabs: WebsiteId[];
  reusedTabs: WebsiteId[];
  failedWebsites: { websiteId: WebsiteId; reason: string }[];
  error: string | null;
}

export interface AppSettings {
  schemaVersion: number;
  catalogSeedVersion: number;
}

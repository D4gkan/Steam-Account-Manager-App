/**
 * Detects the SteamID64 / name / avatar of the account that is actually
 * logged into the browser profile -- NOT of whatever public profile page
 * happens to be open. Steam's own markup exposes this distinction because
 * the top-right account menu (rendered site-wide once logged in) links to
 * the *viewer's own* profile, separately from any profile page currently
 * being displayed in the tab body.
 *
 * This adapter only looks at DOM signals reachable through the companion
 * extension's content script (see companion-extension/); it never reads
 * cookies, and it never treats "a Steam profile URL is open" as proof of
 * identity by itself.
 */

export interface SteamPageSignals {
  /** URL of the page the companion extension observed. */
  url: string;
  /** True if Steam's site-wide header shows a logged-in account menu. */
  isAuthenticated: boolean;
  /**
   * The steamid64 and persona name Steam's own header exposes for the
   * logged-in user (parsed by the content script from
   * `g_steamID` / the account dropdown's data attributes), independent of
   * whichever profile page is being viewed.
   */
  ownProfile: { steamId64: string; personaName: string; avatarUrl: string | null } | null;
}

export type IdentityDetectionResult =
  | { kind: "confirmed"; steamId64: string; personaName: string; avatarUrl: string | null }
  | { kind: "not_authenticated" }
  | { kind: "signals_unavailable" }; // e.g. Steam markup changed; content script found nothing

/**
 * Pure function: given the signals the content script extracted from the
 * live page, decide the identity outcome. Kept pure and dependency-free so
 * it can be unit tested against markup-change fixtures without a browser.
 */
export function detectOwnIdentity(signals: SteamPageSignals): IdentityDetectionResult {
  try {
    const url = new URL(signals.url);
    if (url.protocol !== "https:" || !["steamcommunity.com", "store.steampowered.com"].includes(url.hostname) || url.port) return { kind: "signals_unavailable" };
  } catch { return { kind: "signals_unavailable" }; }
  if (!signals.isAuthenticated) {
    return { kind: "not_authenticated" };
  }
  if (!signals.ownProfile || typeof signals.ownProfile.steamId64 !== "string" || !/^7656119\d{10}$/.test(signals.ownProfile.steamId64) || typeof signals.ownProfile.personaName !== "string") {
    // Authenticated per the header, but we couldn't extract the own-profile
    // identity block -- treat as a detection failure, not as "no account."
    return { kind: "signals_unavailable" };
  }
  return {
    kind: "confirmed",
    steamId64: signals.ownProfile.steamId64,
    personaName: signals.ownProfile.personaName,
    avatarUrl: signals.ownProfile.avatarUrl,
  };
}

/**
 * Decides what to do when a profile is already confirmed and the browser
 * later reports a *different* own-identity signal (e.g. the user logged
 * into a different Steam account inside the same persistent profile).
 * Never silently rebinds; the caller must surface this for explicit
 * reconciliation.
 */
export function checkForIdentityMismatch(
  confirmedSteamId64: string,
  latest: IdentityDetectionResult
): "match" | "mismatch" | "inconclusive" {
  if (latest.kind !== "confirmed") return "inconclusive";
  return latest.steamId64 === confirmedSteamId64 ? "match" : "mismatch";
}

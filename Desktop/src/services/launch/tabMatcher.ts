import { WebsiteMatchConfig } from "../../domain/types";
import { normalizeOrigin } from "../../domain/validation";

/** Minimal live-tab shape the matcher needs; the real bridge supplies more. */
export interface LiveTab {
  tabId: number;
  windowId: number;
  url: string;
  pinned: boolean;
  index: number; // position within its window
}

export interface MatchResult {
  websiteId: string;
  match: LiveTab | null;
}

/**
 * Decides whether a live tab's current URL still belongs to a configured
 * website. Matching is origin-based (+ optional path rule), never by page
 * title, substring, or bare registrable domain -- this is what prevents,
 * e.g., two different *.vercel.app sites from being conflated, and what
 * stops a generic Steam auth redirect page from being treated as "the
 * trading site."
 */
export function tabMatchesWebsite(tab: LiveTab, config: WebsiteMatchConfig): boolean {
  let tabUrl: URL;
  try {
    tabUrl = new URL(tab.url);
  } catch {
    return false;
  }
  const tabOrigin = normalizeOrigin(tab.url);
  if (tabOrigin !== config.origin) return false;
  if (config.preserveQuery && tabUrl.search !== (config.query ?? "")) return false;

  if (config.pathMode === "any") return true;

  if (config.pathMode === "exact") {
    return tabUrl.pathname === config.path;
  }

  // prefix
  const prefix = config.path ?? "/";
  return tabUrl.pathname === prefix || tabUrl.pathname.startsWith(prefix.endsWith("/") ? prefix : prefix + "/");
}

/**
 * For each requested website (in click order), finds a deterministic
 * existing-tab match among `liveTabs`, preferring the tab with the lowest
 * tabId (stable, deterministic tie-break) among candidates not already
 * claimed by an earlier website in this same request. Tabs matched to one
 * website are excluded from candidacy for a later website in the same
 * request, so two requested sites never fight over the same tab.
 */
export function matchRequestedWebsites(
  requested: Array<{ websiteId: string; matchConfig: WebsiteMatchConfig }>,
  liveTabs: LiveTab[],
  catalog = requested,
  associations = new Map<number, string>()
): MatchResult[] {
  const claimed = new Set<number>(); // tabId
  const results: MatchResult[] = [];

  for (const { websiteId, matchConfig } of requested) {
    const candidates = liveTabs
      .filter((t) => !claimed.has(t.tabId))
      .filter((t) => tabMatchesWebsite(t, matchConfig))
      .filter(t => !catalog.some(other => other.websiteId !== websiteId &&
        tabMatchesWebsite(t, other.matchConfig) &&
        specificity(other.matchConfig) > specificity(matchConfig)))
      .sort((a, b) => Number(associations.get(b.tabId) === websiteId) - Number(associations.get(a.tabId) === websiteId) || a.tabId - b.tabId);

    const match = candidates[0] ?? null;
    if (match) claimed.add(match.tabId);
    results.push({ websiteId, match });
  }

  return results;
}

function specificity(config: WebsiteMatchConfig): number {
  return (config.pathMode === 'exact' ? 10000 : config.pathMode === 'prefix' ? (config.path?.length || 1) : 0) + (config.preserveQuery && config.query ? 20000 : 0);
}

/**
 * Computes the target tab order for the primary window: requested tabs
 * first (in click order, using their resolved or to-be-created positions),
 * then all remaining tabs preserving their prior relative order.
 */
export function computeTargetOrder(
  requestedTabIds: number[], // in desired order; -1 placeholders for "to be created" are not included here
  allTabIdsInPriorOrder: number[]
): number[] {
  const requestedSet = new Set(requestedTabIds);
  const remainder = allTabIdsInPriorOrder.filter((id) => !requestedSet.has(id));
  return [...requestedTabIds, ...remainder];
}

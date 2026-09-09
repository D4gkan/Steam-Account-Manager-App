import { describe, expect, it } from "vitest";
import { computeTargetOrder, LiveTab, matchRequestedWebsites, tabMatchesWebsite } from "../src/services/launch/tabMatcher";
import { WebsiteMatchConfig } from "../src/domain/types";

const steamConfig: WebsiteMatchConfig = { origin: "https://store.steampowered.com", pathMode: "any", preserveQuery: false };
const csfloatConfig: WebsiteMatchConfig = { origin: "https://csfloat.com", pathMode: "any", preserveQuery: false };
const empireRouletteConfig: WebsiteMatchConfig = {
  origin: "https://csgoempire.com",
  pathMode: "prefix",
  path: "/roulette",
  preserveQuery: false,
};
// Two distinct custom vercel.app sites must never be conflated by origin.
const dashboardAConfig: WebsiteMatchConfig = { origin: "https://first-dashboard.vercel.app", pathMode: "any", preserveQuery: false };
const dashboardBConfig: WebsiteMatchConfig = { origin: "https://someotherapp.vercel.app", pathMode: "any", preserveQuery: false };

function tab(tabId: number, url: string, opts: Partial<LiveTab> = {}): LiveTab {
  return { tabId, windowId: 1, url, pinned: false, index: tabId, ...opts };
}

describe("tabMatchesWebsite", () => {
  it("matches same origin regardless of path when pathMode is any", () => {
    expect(tabMatchesWebsite(tab(1, "https://csfloat.com/profile/123"), csfloatConfig)).toBe(true);
  });

  it("does not match a different vercel.app origin", () => {
    expect(tabMatchesWebsite(tab(1, "https://someotherapp.vercel.app/"), dashboardAConfig)).toBe(false);
  });

  it("respects prefix path matching", () => {
    expect(tabMatchesWebsite(tab(1, "https://csgoempire.com/roulette/history"), empireRouletteConfig)).toBe(true);
    expect(tabMatchesWebsite(tab(2, "https://csgoempire.com/coinflip"), empireRouletteConfig)).toBe(false);
  });

  it("never matches by title or substring -- only by parsed URL origin+path", () => {
    // A tab whose URL happens to contain the word "steam" in a query string
    // on an unrelated origin must not match the Steam website config.
    const trickyTab = tab(1, "https://example.com/?ref=steam");
    expect(tabMatchesWebsite(trickyTab, steamConfig)).toBe(false);
  });

  it("treats an invalid/unparseable tab URL as non-matching rather than throwing", () => {
    expect(tabMatchesWebsite(tab(1, "not-a-url"), steamConfig)).toBe(false);
  });
});

describe("matchRequestedWebsites", () => {
  it("example from spec: Steam+CSFloat already open, request CSFloat->CSGOEmpire->Steam", () => {
    const liveTabs: LiveTab[] = [
      tab(10, "https://store.steampowered.com/account/"),
      tab(11, "https://csfloat.com/profile/76561198000000000"),
      tab(12, "https://example.com/unrelated"),
    ];
    const requested = [
      { websiteId: "csfloat", matchConfig: csfloatConfig },
      { websiteId: "csgoempire", matchConfig: empireRouletteConfig },
      { websiteId: "steam", matchConfig: steamConfig },
    ];
    const results = matchRequestedWebsites(requested, liveTabs);

    expect(results[0].match?.tabId).toBe(11); // existing CSFloat tab reused
    expect(results[1].match).toBeNull(); // CSGOEmpire not open -> needs creation
    expect(results[2].match?.tabId).toBe(10); // existing Steam tab reused
  });

  it("does not let two requested websites claim the same tab", () => {
    // Only one tab matches an origin that (hypothetically) satisfies two
    // overlapping configs; ensure the second requested site gets no match
    // rather than double-claiming.
    const liveTabs: LiveTab[] = [tab(1, "https://csfloat.com/")];
    const requested = [
      { websiteId: "a", matchConfig: csfloatConfig },
      { websiteId: "b", matchConfig: csfloatConfig },
    ];
    const results = matchRequestedWebsites(requested, liveTabs);
    expect(results[0].match?.tabId).toBe(1);
    expect(results[1].match).toBeNull();
  });

  it("picks the lowest tabId deterministically when multiple tabs match", () => {
    const liveTabs: LiveTab[] = [tab(5, "https://csfloat.com/a"), tab(3, "https://csfloat.com/b")];
    const requested = [{ websiteId: "csfloat", matchConfig: csfloatConfig }];
    const results = matchRequestedWebsites(requested, liveTabs);
    expect(results[0].match?.tabId).toBe(3);
  });
});

describe("computeTargetOrder", () => {
  it("puts requested tabs first, then preserves relative order of the rest", () => {
    const order = computeTargetOrder([11, 12], [10, 11, 12, 13]);
    expect(order).toEqual([11, 12, 10, 13]);
  });
});

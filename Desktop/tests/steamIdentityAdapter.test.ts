import { describe, expect, it } from "vitest";
import {
  checkForIdentityMismatch,
  detectOwnIdentity,
  SteamPageSignals,
} from "../src/services/metadata/steamIdentityAdapter";

describe("detectOwnIdentity", () => {
  it("confirms identity from the site-wide header, regardless of which profile page is open", () => {
    const signals: SteamPageSignals = {
      url: "https://steamcommunity.com/id/someoneElsesVanityUrl",
      isAuthenticated: true,
      ownProfile: {
        steamId64: "76561198012345678",
        personaName: "MyAccount",
        avatarUrl: "https://avatars.steamstatic.com/abc.jpg",
      },
    };
    const result = detectOwnIdentity(signals);
    expect(result).toEqual({
      kind: "confirmed",
      steamId64: "76561198012345678",
      personaName: "MyAccount",
      avatarUrl: "https://avatars.steamstatic.com/abc.jpg",
    });
  });

  it("does not confirm identity just because *a* Steam profile URL is open while logged out", () => {
    const signals: SteamPageSignals = {
      url: "https://steamcommunity.com/id/someoneElsesVanityUrl",
      isAuthenticated: false,
      ownProfile: null,
    };
    expect(detectOwnIdentity(signals)).toEqual({ kind: "not_authenticated" });
  });

  it("reports signals_unavailable (not a false negative account) when markup changed", () => {
    const signals: SteamPageSignals = {
      url: "https://store.steampowered.com/",
      isAuthenticated: true,
      ownProfile: null, // content script's selector found nothing
    };
    expect(detectOwnIdentity(signals)).toEqual({ kind: "signals_unavailable" });
  });
});

describe("checkForIdentityMismatch", () => {
  it("flags a mismatch when a different account becomes the logged-in identity", () => {
    const latest = detectOwnIdentity({
      url: "https://steamcommunity.com/my/",
      isAuthenticated: true,
      ownProfile: { steamId64: "76561198099999999", personaName: "Other", avatarUrl: null },
    });
    expect(checkForIdentityMismatch("76561198012345678", latest)).toBe("mismatch");
  });

  it("confirms a match for the same account", () => {
    const latest = detectOwnIdentity({
      url: "https://steamcommunity.com/my/",
      isAuthenticated: true,
      ownProfile: { steamId64: "76561198012345678", personaName: "MyAccount", avatarUrl: null },
    });
    expect(checkForIdentityMismatch("76561198012345678", latest)).toBe("match");
  });

  it("is inconclusive rather than a false mismatch when signals are unavailable", () => {
    const latest = detectOwnIdentity({ url: "x", isAuthenticated: true, ownProfile: null });
    expect(checkForIdentityMismatch("76561198012345678", latest)).toBe("inconclusive");
  });
});

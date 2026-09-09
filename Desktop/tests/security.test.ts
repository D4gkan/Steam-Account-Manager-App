import { describe, expect, it } from 'vitest';
import { buildMatchConfigFromUrl, isSafeLaunchUrl } from '../src/domain/validation';
import { tabMatchesWebsite } from '../src/services/launch/tabMatcher';
import { detectOwnIdentity } from '../src/services/metadata/steamIdentityAdapter';
import { publicAddress } from '../src/services/icons/safeFetch';
const tab = (url: string) => ({ url, tabId: 1, windowId: 1, index: 0, pinned: false });
describe('launch and fetch security boundaries', () => {
  it('keeps meaningful paths, queries, origins and ports distinct', () => {
    const config = buildMatchConfigFromUrl('https://example.com/market?view=sell');
    expect(tabMatchesWebsite(tab('https://example.com/market?view=sell'), config)).toBe(true);
    for (const url of ['https://example.com/market?view=buy', 'https://example.com/other?view=sell', 'https://example.com:8443/market?view=sell', 'https://example.net/market?view=sell']) expect(tabMatchesWebsite(tab(url), config)).toBe(false);
  });
  it('does not mistake a lexical path prefix for a path segment', () => {
    const config = buildMatchConfigFromUrl('https://example.com/trade', 'prefix', false);
    expect(tabMatchesWebsite(tab('https://example.com/trade/123'), config)).toBe(true);
    expect(tabMatchesWebsite(tab('https://example.com/trademark'), config)).toBe(false);
  });
  it('rejects privileged schemes and credentials', () => {
    for (const url of ['javascript:alert(1)', 'file:///tmp/a', 'data:text/html,hi', 'https://user:secret@example.com']) expect(isSafeLaunchUrl(url)).toBe(false);
    expect(isSafeLaunchUrl('https://example.com/')).toBe(true);
  });
  it('blocks private, reserved and mapped private fetch addresses', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '169.254.169.254', '192.168.1.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '0.0.0.0', '100.64.0.1', '224.0.0.1']) expect(publicAddress(address), address).toBe(false);
    expect(publicAddress('1.1.1.1')).toBe(true);
  });
  it('rejects foreign origins and numeric Steam identifiers', () => {
    const ownProfile = { steamId64: '76561198012345678', personaName: 'Example', avatarUrl: null };
    expect(detectOwnIdentity({ url: 'https://steamcommunity.com.evil.test/', isAuthenticated: true, ownProfile }).kind).toBe('signals_unavailable');
    expect(detectOwnIdentity({ url: 'https://steamcommunity.com/', isAuthenticated: true, ownProfile: { ...ownProfile, steamId64: 76561198012345678 as any } }).kind).toBe('signals_unavailable');
  });
});

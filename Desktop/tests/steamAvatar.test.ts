import { describe, expect, it, vi, beforeEach } from 'vitest';
import { profileAvatarUrls, fetchSteamAvatar } from '../src/services/metadata/steamAvatar';
import { safeFetch } from '../src/services/icons/safeFetch';
import { cacheImage } from '../src/services/icons/iconFetcher';
vi.mock('../src/services/icons/safeFetch', () => ({ safeFetch: vi.fn() }));
vi.mock('../src/services/icons/iconFetcher', () => ({ cacheImage: vi.fn() }));
const id = '76561198012345678', page = `https://steamcommunity.com/profiles/${id}/?xml=1`;
const avatar = 'https://avatars.akamai.steamstatic.com/owner_full.jpg';
const friend = '<friends><friend><steamID64>76561198099999999</steamID64><avatarFull>https://avatars.steamstatic.com/friend.jpg</avatarFull></friend></friends>';
const xml = `<profile>${friend}<steamID64>${id}</steamID64><avatarFull><![CDATA[${avatar}]]></avatarFull></profile>`;
beforeEach(() => vi.resetAllMocks());
describe('Steam avatar ownership', () => {
  it('selects only the owner field even when a friend appears first', () => {
    expect(profileAvatarUrls(xml, id, page)).toEqual([avatar]);
  });
  it('never substitutes a friend if the account avatar is absent', () => {
    expect(profileAvatarUrls(`<profile><steamID64>${id}</steamID64>${friend}</profile>`, id, page)).toEqual([]);
  });
  it('rejects mismatched identities and unrelated responses', () => {
    expect(() => profileAvatarUrls(xml, '76561198099999999', page)).toThrow();
    expect(() => profileAvatarUrls(xml, id, 'https://example.com/')).toThrow();
    expect(() => profileAvatarUrls('<html><div class=playerAvatar><img src=friend.jpg></div></html>', id, page)).toThrow();
  });
  it('rejects ambiguous owner fields', () => {
    expect(profileAvatarUrls(xml.replace('</profile>', '<avatarFull>https://avatars.steamstatic.com/other.jpg</avatarFull></profile>'), id, page)).toEqual([]);
    expect(() => profileAvatarUrls(xml.replace('</profile>', `<steamID64>${id}</steamID64></profile>`), id, page)).toThrow();
  });
  it('does not use a nested friend identity to verify ownership', () => {
    expect(() => profileAvatarUrls(`<profile>${friend}<avatarFull>${avatar}</avatarFull></profile>`, '76561198099999999', page)).toThrow();
  });
  it('downloads and caches only the verified account image', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce({ bytes: Buffer.from(xml), url: page, type: 'text/xml' })
      .mockResolvedValueOnce({ bytes: Buffer.from('image'), url: avatar, type: 'image/jpeg' });
    vi.mocked(cacheImage).mockResolvedValue('cache/avatar.png');
    expect(await fetchSteamAvatar(id, 'cache')).toBe('cache/avatar.png');
    expect(safeFetch).toHaveBeenNthCalledWith(1, page);
    expect(safeFetch).toHaveBeenNthCalledWith(2, avatar);
  });
  it('does not download any image when ownership cannot be verified', async () => {
    vi.mocked(safeFetch).mockResolvedValueOnce({ bytes: Buffer.from(xml), url: page, type: 'text/xml' });
    await expect(fetchSteamAvatar('76561198099999999', 'cache')).rejects.toThrow();
    expect(safeFetch).toHaveBeenCalledTimes(1);
    expect(cacheImage).not.toHaveBeenCalled();
  });
});

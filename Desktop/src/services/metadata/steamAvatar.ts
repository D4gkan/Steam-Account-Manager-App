import { load } from 'cheerio';
import { safeFetch } from '../icons/safeFetch';
import { cacheImage } from '../icons/iconFetcher';

export function isSteamAvatarUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      ['avatars.steamstatic.com', 'avatars.akamai.steamstatic.com', 'avatars.fastly.steamstatic.com', 'steamcdn-a.akamaihd.net'].includes(url.hostname);
  } catch { return false; }
}

export function profileAvatarUrls(xml: string, steamId64: string, pageUrl: string): string[] {
  const url = new URL(pageUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'steamcommunity.com' || url.username || url.password || url.port) throw Error('Unexpected profile response');
  const $ = load(xml, { xmlMode: true });
  const profile = $.root().children('profile');
  const identity = profile.children('steamID64');
  if (profile.length !== 1 || identity.length !== 1 || identity.text().trim() !== steamId64) throw Error('Profile identity could not be verified');
  // Only direct account fields, never friend/comment/showcase avatars nested below.
  const avatar = profile.children('avatarFull');
  if (avatar.length !== 1) return [];
  const candidate = avatar.text().trim();
  return isSteamAvatarUrl(candidate) ? [candidate] : [];
}

// Public profile metadata only: no browser cookies, tokens, or credentials.
export async function fetchSteamAvatar(steamId64: string, cacheDir: string): Promise<string> {
  if (!/^7656119\d{10}$/.test(steamId64)) throw Error('Invalid Steam identity');
  const page = await safeFetch(`https://steamcommunity.com/profiles/${steamId64}/?xml=1`);
  const candidates = profileAvatarUrls(page.bytes.toString('utf8'), steamId64, page.url);
  for (const candidate of new Set(candidates)) {
    try {
      const image = await safeFetch(candidate);
      if (!isSteamAvatarUrl(image.url)) continue;
      return await cacheImage(image.bytes, cacheDir);
    } catch { /* Try the next own-account image. */ }
  }
  throw Error('Could not refresh the Steam profile picture. Please try again.');
}

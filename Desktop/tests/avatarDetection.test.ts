import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const script = readFileSync('companion-extension/identity-content-script.js', 'utf8');
async function detect(header: string | null, profile: string[]) {
  const signals: any[] = [];
  const img = (src: string) => ({ getAttribute: () => src });
  const ownUrl = 'https://steamcommunity.com/profiles/76561198012345678/';
  await runInNewContext(script, {
    URL, AbortSignal,
    document: { querySelector: (selector: string) => selector === '#account_pulldown' ? {} :
      { href: ownUrl, querySelector: () => header ? img(header) : null } },
    fetch: async () => ({ ok: true, url: ownUrl, text: async () => 'g_rgProfileData = {"steamid":"76561198012345678"};' }),
    DOMParser: class { parseFromString() { return {
      querySelector: () => ({ textContent: 'Synthetic account' }),
      querySelectorAll: () => profile.map(img),
    }; } },
    chrome: { runtime: { sendMessage: async (message: any) => { signals.push(message.signals); }, onMessage: { addListener() {} } } },
  });
  return signals[0].ownProfile.avatarUrl;
}
describe('own-account avatar detection', () => {
  it('leaves image ownership verification to the main process', async () => {
    expect(await detect('https://avatars.steamstatic.com/old.jpg', ['https://avatars.steamstatic.com/new_full.jpg'])).toBeNull();
  });
  it('does not fall back to a potentially stale header image', async () => {
    expect(await detect('//avatars.fastly.steamstatic.com/example.jpg', [])).toBeNull();
  });
  it('does not forward generic profile-page images including friends', async () => {
    expect(await detect(null, ['https://cdn.example/frame.png', 'https://avatars.steamstatic.com/friend.jpg'])).toBeNull();
  });
  it('rejects foreign hosts and URLs containing credentials', async () => {
    expect(await detect('https://avatars.steamstatic.com.evil.test/image.jpg', ['https://secret@avatars.steamstatic.com/image.jpg'])).toBeNull();
  });
});

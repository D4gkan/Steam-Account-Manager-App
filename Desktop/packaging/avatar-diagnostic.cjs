// Read-only diagnosis. Never print identifiers, names, URLs, paths, or response bodies.
const path = require('node:path'), fs = require('node:fs');
const Database = require('better-sqlite3');
const { safeFetch } = require('../dist/main/services/icons/safeFetch');
const { load } = require('cheerio');
(async () => {
  const db = new Database(path.join(process.env.APPDATA, 'SteamAccountManagerApp/db/app.sqlite3'), { readonly: true });
  const accounts = db.prepare('SELECT steam_id64, avatar_cache_path FROM accounts WHERE steam_id64 IS NOT NULL').all();
  db.close();
  for (const account of accounts) {
    const summary = { cached: !!account.avatar_cache_path, cacheExists: !!account.avatar_cache_path && fs.existsSync(account.avatar_cache_path) };
    const cacheRoot = path.join(process.env.APPDATA, 'SteamAccountManagerApp/cache');
    summary.displayPathAccepted = !!account.avatar_cache_path && path.resolve(account.avatar_cache_path).startsWith(path.resolve(cacheRoot) + path.sep);
    if (summary.cacheExists) {
      const metadata = await require('sharp')(account.avatar_cache_path).metadata();
      summary.cachedFormat = metadata.format;
      summary.cachedDimensions = [metadata.width, metadata.height];
    }
    try {
      const page = await safeFetch('https://steamcommunity.com/profiles/' + account.steam_id64 + '/');
      const $ = load(page.bytes.toString());
      const candidates = $('.playerAvatarAutoSizeInner img, .playerAvatar img').toArray().map(el => $(el).attr('src')).filter(Boolean);
      summary.profileAvatarFound = candidates.length > 0;
      summary.avatarHosts = candidates.map(raw => new URL(raw, page.url).hostname);
      if (candidates.length) {
        const result = await safeFetch(new URL(candidates[0], page.url).href);
        summary.downloaded = result.bytes.length > 0;
        summary.imageFormat = (await require('sharp')(result.bytes).metadata()).format;
        const png = await require('sharp')(result.bytes).resize(128, 128, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
        summary.cacheMatchesCurrentProfile = summary.cacheExists && fs.readFileSync(account.avatar_cache_path).equals(png);
        const cached = await require('sharp')(account.avatar_cache_path).resize(32, 32).raw().toBuffer();
        const current = await require('sharp')(result.bytes).resize(32, 32).raw().toBuffer();
        summary.cachePixelsMatchProfile = cached.equals(current);
        const fallback = await safeFetch('https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg');
        summary.cacheIsDefaultAvatar = cached.equals(await require('sharp')(fallback.bytes).resize(32, 32).raw().toBuffer());
      }
    } catch (e) { summary.failureType = e.code || e.name; }
    console.log(JSON.stringify(summary));
  }
})().catch(() => { console.log('Read-only avatar diagnosis failed'); process.exitCode = 1; });

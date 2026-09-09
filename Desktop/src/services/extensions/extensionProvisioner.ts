import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { ExtensionKey, ExtensionPackage } from '../../domain/types';
export const EXPECTED_LEGACY_IDS: Record<ExtensionKey, string> = {
  betterfloat: 'bphfhlfhnohppnleaehnlfigkkccpglk', csmoney: 'mkjknmlmebnimmkonggecjlccealonel',
  'cs2-trader': 'kaibcgikagnkfgjnibflebpldakfhfih', 'csfloat-market-checker': 'jjicbefpemnphinccgikpdaagjebbnhg',
  'proton-vpn': 'jplgfhpmjnbigmhklmmbgecoobifkmpa', skinscom: 'inlmjddlgofjocncdogkelkfbgkecphn',
  'trade-token-sync': 'kbcomfmcakpckijlmbkglflflmokhgof', 'csgoempire-quick-buy': 'daihhedcnbacghagnhoiafnkiegkdcmd',
};
/** Hash immutable code; Chromium generates mutable indexed rule caches in _metadata. */
export function computeDigest(extensionDir: string): string {
  const hash = crypto.createHash('sha256'), files: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '_metadata') continue;
      if (entry.isSymbolicLink()) throw Error('Linked extension assets are not permitted');
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full); else files.push(full);
    }
  })(extensionDir);
  files.sort();
  for (const file of files) { hash.update(path.relative(extensionDir, file).split(path.sep).join('/') + '\0'); hash.update(crypto.createHash('sha256').update(fs.readFileSync(file)).digest()); }
  return hash.digest('hex');
}
function checkReferences(dir: string, manifest: any) {
  const refs = [manifest.background?.service_worker, ...(manifest.background?.scripts || []), manifest.action?.default_popup, manifest.options_ui?.page, manifest.options_page, ...Object.values(manifest.icons || {}), ...(manifest.content_scripts || []).flatMap((s: any) => [...(s.js || []), ...(s.css || [])])].filter(Boolean);
  for (const ref of refs) {
    if (typeof ref !== 'string') throw Error('Invalid manifest reference');
    const resource = new URL(ref, 'https://extension.invalid/');
    if (resource.origin !== 'https://extension.invalid') throw Error('External manifest asset');
    const resolved = path.resolve(dir, decodeURIComponent(resource.pathname).replace(/^\/+/, ''));
    if (!resolved.startsWith(path.resolve(dir) + path.sep) || !fs.statSync(resolved).isFile()) throw Error('Missing or unsafe extension asset');
  }
  if (manifest.default_locale && !fs.existsSync(path.join(dir, '_locales', manifest.default_locale, 'messages.json'))) throw Error('Missing default locale');
}
export function inspectExtensionFolder(key: ExtensionKey, extensionDir: string): ExtensionPackage {
  const base: ExtensionPackage = { key, expectedLegacyId: EXPECTED_LEGACY_IDS[key], actualId: null, version: null, source: key === 'csgoempire-quick-buy' ? 'supplied-custom-folder' : 'publisher-package', digest: null, packageRelativePath: key, compatibilityStatus: 'failed' };
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));
    base.version = typeof manifest.version === 'string' ? manifest.version : null;
    base.digest = computeDigest(extensionDir);
    if (typeof manifest.key === 'string') base.actualId = [...crypto.createHash('sha256').update(Buffer.from(manifest.key, 'base64')).digest('hex').slice(0,32)].map(c => String.fromCharCode(97 + parseInt(c,16))).join('');
    if (manifest.manifest_version !== 3) return { ...base, compatibilityStatus: 'incompatible' };
    if (!base.version || typeof manifest.name !== 'string') return base;
    checkReferences(extensionDir, manifest);
    return { ...base, compatibilityStatus: 'installed' }; // staged assets, not functional verification
  } catch { return base; }
}
export function inspectAllExtensions(root: string): ExtensionPackage[] {
  return (Object.keys(EXPECTED_LEGACY_IDS) as ExtensionKey[]).map(key => inspectExtensionFolder(key, path.join(root, key)));
}

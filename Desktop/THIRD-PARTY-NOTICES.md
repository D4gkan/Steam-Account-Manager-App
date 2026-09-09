# Third-party notices and provenance

The app's own code is licensed under MIT. It includes third-party software with its own licenses. This file identifies components; it does not grant redistribution rights to supplied extensions.

- Electron — MIT; its Chromium and bundled components have separate notices in the Electron distribution.
- Playwright — Apache-2.0. Chromium/Chrome for Testing is downloaded from Playwright's official distribution endpoint; retain its packaged license/credits files.
- React — MIT.
- better-sqlite3 — MIT; SQLite is public domain.
- sharp/libvips — retain dependency licenses (Apache-2.0/LGPL components as applicable).
- @yao-pkg/pkg and its bundled Node runtime — retain their package/runtime license notices.
- Other npm packages retain their individual LICENSE files in node_modules/package distributions.

Supplied extensions: BetterFloat, CS.Money, CS2 Trader, CSFloat Market Checker, Proton VPN, Skins.com Marketplace, Trade Token Sync and CSGOEmpire Quick Buy. Their original assets are under resources/extensions; legacy IDs and supplied versions appear in EXTENSION-PROVENANCE.json. No publisher signature or redistribution permission is implied by a matching version or content digest.

Per-install staging preserves existing manifest keys. If absent, the manager adds a stable public key and records this transformation in sam-provenance.json in the staged package. Source code digests exclude browser-generated _metadata caches; no authentication cookies or tokens are included in provenance.

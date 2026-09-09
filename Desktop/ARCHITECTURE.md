# Architecture

## Trusted manager and external browsers

Electron 44.2.0 hosts a local React dashboard. Renderer Node integration is disabled; context isolation and sandboxing are enabled. Navigation and new windows are denied, and the preload exposes fixed validated IPC methods. Cached images are delivered as PNG data URLs rather than arbitrary filesystem access.

`src/services/browser/browserManager.ts` launches Playwright 1.63.0's Chromium revision 1243 as a detached child, using an argument array and ignored stdio. Production does not launch Playwright contexts or expose a debugging port. Chromium's singleton mechanism owns profile locks; the manager does not remove browser locks. Process command lines containing the managed user-data directory are checked before reconnecting or deleting. Saved PIDs are only hints.

`src/services/browser/bridgeServer.ts` accepts a native host over a named pipe on Windows or mode-0600 Unix socket on Linux. First it checks the per-install secret, then a per-account capability. The companion's pinned extension ID restricts native host allowed origins. Each account's private companion assets contain its capability; website scripts cannot access them. Requests are allowlisted, bounded, correlated to the same authenticated socket and timed out. Manager exit closes the relay, not Chromium. Native-port reconnect timers and alarms restore connections.

`native-bridge/host.js` is compiled with @yao-pkg/pkg into a standalone Node 22 executable. It verifies Chromium's calling extension origin and forwards bounded native frames. It needs no system Node. Windows registration has been proven with the selected runtime. Linux registration remains untested.

## Launching and selection

`LaunchService` serializes each account's operations and limits multi-account startup to two accounts. IPC rejects overlapping submissions. The companion enumerates real tab/window IDs, excludes incognito, creates tabs without waiting for page loads, reuses matching tabs without navigating them, reorders and focuses the requested tabs. Focus restrictions do not turn a successful arrangement into a failure.

Matching checks full normalized origins including ports, explicit paths and meaningful queries. More specific shared catalog entries reserve their matching tabs so an origin-wide entry cannot steal them. Runtime associations are preferred only while the observed URL remains valid. No title or registrable-domain matching is used. Unknown redirects create another tab rather than hijacking an unrelated page.

React keeps launch selection in memory. Catalog display order is separate and transactional. Clicking an account row replaces launch targets with that account; checkboxes edit the multi-account set. Selection reorder supports drag and keyboard-accessible buttons.

## Identity

The content script reads Steam's authenticated header own-profile link and fetches only that Steam profile, using browser-managed authentication. It parses the fetched own-profile metadata without evaluating scripts or reading cookies. The observed arbitrary public profile's subject is ignored. The adapter validates the Steam origin and string SteamID64. Duplicates never merge profiles, mismatches never rebind automatically, and custom labels survive metadata refreshes. Synthetic real-browser fixtures validate this distinction; live authenticated Steam markup still requires user verification.

## Persistence and assets

SQLite runs in WAL mode with foreign keys, migrations, unique identity constraints and a seed-version gate. Deleted default websites are not recreated. Account UUIDs and profile UUIDs do not change on rename.

Extensions are staged by code digest in immutable per-user directories. Existing publisher manifest keys are retained; packages without keys receive stable per-install public keys. Actual IDs are compared with chrome.management results. Generated Chromium `_metadata` rule caches are excluded from code integrity digests. Provenance records distinguish the supplied digest from staged assets. Updates apply only on a safe browser restart; old assets remain for existing browsers.

Icon fetching validates every redirect and DNS answer, pins the public address during the request, bounds time/bytes and parses declared icons without executing HTML. PNG/JPEG/WebP/GIF and supported ICO bitmap/PNG entries are decoded and re-encoded to PNG. SVG and non-PNG uploads are rejected.

## Build and packaging

Compiled main: `dist/main/main/index.js`; preload: `dist/preload/preload/index.js`; renderer: `dist/renderer`. SQL migrations are copied beside compiled persistence code. Electron-builder includes native modules, the native host, supplied extensions and Chromium. First-run download is a fallback through the pinned Playwright installer. Windows uses per-user NSIS; Linux build definitions target AppImage/deb and must run on Linux.

Primary API references: [Playwright extensions](https://playwright.dev/docs/chrome-extensions), [Chromium native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging), [Chrome tabs](https://developer.chrome.com/docs/extensions/reference/api/tabs), [Chrome management](https://developer.chrome.com/docs/extensions/reference/api/management).

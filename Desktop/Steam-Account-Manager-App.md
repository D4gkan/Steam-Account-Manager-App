# Steam Account Manager App

## Revised product documentation, architecture, and implementation prompt

This document supersedes the supplied command-line application's documentation. It describes a new application to build, not an implementation already completed or tested. The source material supplied was documentation; actual source files and extension assets were not supplied for inspection. All requirements below incorporate the user's clarified decisions.

## 1. Copy-ready developer instruction

You are a senior cross-platform desktop engineer and browser-integration engineer. Build a complete Windows and Linux desktop application named **Steam Account Manager App** using this specification as the source of truth. Implement the working application, packaging, meaningful tests, and user/developer documentation. Do not stop at a UI mockup or architectural proposal. Inspect any repository and actual supplied extension assets before changing them. Keep progress and limitations factual.

Build a fresh application. There is no legacy-account import or migration requirement. Remove the old Poly's Alts branding and replace the terminal menu with the dashboard described below. Completely exclude Always Online, headless keep-alive browsers, monitoring screenshots, Discord webhooks, and associated scripts/data. Browser lifecycle tracking for dashboard operations remains necessary, but it must not become an Always Online feature.

Resolve routine engineering choices autonomously. Never invent missing extension code, claim an extension works because its folder exists, or report untested platform behavior as verified. Prove the browser/extension integration early, before investing in the complete visual layer. If a required third-party asset is unavailable, identify the exact missing input and complete all work that can proceed independently.

## 2. Product purpose and boundaries

The application organizes Steam accounts and launches selected websites in isolated persistent browser profiles. Each account owns one browser user-data directory. All websites opened for that account share that directory. Different accounts never share cookies, local storage, extensions' per-profile state, or authentication sessions.

Users authenticate manually in browser pages. Do not collect Steam passwords, Steam Guard codes, recovery codes, or cookie exports in the dashboard. Do not submit credentials, bypass security checks, or automatically execute trades, purchases, or wagers. Website access and the existing extensions are the scope.

Persistent sessions apply to EVERY website, not just Steam. Browser-managed cookies and site storage survive normal restarts. Each website may require its own first login and may subsequently expire or revoke a session. Opening an arbitrary new tab and navigating to Steam or any previously authenticated website uses the same account profile. Do not promise permanent authentication.

The app has no account/login system of its own and needs no hosted backend. Account/catalog management works from local data when offline; live websites, metadata refreshes, icons, and initial runtime acquisition require connectivity.

## 3. Architecture decision

Use an Electron desktop shell with React and TypeScript for the local dashboard, a typed main-process service layer, and SQLite for structured local records. Use a separate, app-managed, current Chromium runtime for real website browsing. The Electron renderer displays trusted local dashboard content only; do not embed third-party websites in privileged Electron views.

External browser windows provide browser tabs, an address bar, and stronger alignment with the requested Chrome extensions. The account sidebar remains visible in the manager window; it does not appear inside the external browser window. Users can switch accounts in the manager while separate account browsers remain open.

Start with a versioned Playwright-distributed Chromium runtime, launched as an independent visible browser process with a dedicated user-data directory per account. Use Playwright for integration tests and narrowly scoped diagnostics where appropriate, not as an owner whose teardown closes users' browsers. Confirm runtime distribution requirements and Linux dependencies before shipping. Never assume the user's installed Chrome supports unpacked-extension launch flags.

Implement a bundled first-party Manifest V3 companion extension and a packaged native messaging bridge for reliable tab enumeration, creation, movement, window selection, and Steam identity detection. This companion is infrastructure in addition to the eight required user extensions. Use documented browser extension APIs. Do not automate internal chrome://extensions UI or modify protected preference files to imitate successful installation.

The bridge communicates with the manager through an OS-local pipe/socket. Authenticate connections with a per-install secret or equivalent OS-protected capability, constrain the native messaging allowed extension origins, and map each bridge connection to a verified account profile. Keep command schemas allowlisted and typed. Do not expose an unauthenticated browser-control HTTP server or public debugging port.

Validate native messaging registration for the selected Chromium distribution separately on Windows and Linux. The bridge should tolerate manager exit and reconnect when it returns; it must not terminate the browser. Keep service-worker wakeup/reconnection robust instead of assuming a worker remains alive indefinitely.

## 4. Application layout and interactions

Use a polished, compact dark interface: near-black backgrounds, clear card boundaries, red accents, readable text, restrained animation, and keyboard-accessible controls. Avoid ASCII art, console windows, excessive decoration, and ambiguous icon-only actions.

### Account sidebar

Keep the left sidebar visible throughout manager navigation. Each account row displays:

- Cached Steam avatar with a placeholder while loading or offline.
- Custom label as the primary label when set; otherwise Steam name.
- The fetched Steam name as secondary text when a custom label is used.
- Full SteamID64 below the name, with a copy action.
- Clear selected state, a multi-select checkbox, and browser-open/closed/unknown status.

Provide Add account, account search, rename/custom label, metadata refresh, and delete actions. Search should match Steam name, custom label, and SteamID64. Do not label a browser's presence as proof that every website is logged in.

Clicking an account row selects it as the sole launch target. Checkboxes support multiple selected accounts. Account changes do not launch websites. The main area displays the selected account or account count without allowing users to confuse browser profiles.

### Website catalog and selection

Render one shared website catalog for all accounts. Every card displays an icon and name. Clicking a card toggles selection; it never opens the website immediately. Selected cards receive numbered badges in click order. Display the selected websites in a visible ordered strip/list with drag handles, removal, and accessible move-left/right or move-up/down alternatives. Removing an item renumbers the rest; selecting it again appends it.

Provide Clear selection and **Open selected websites**. Disable launching when no accounts or no websites are selected. Show the selected account count and tab count before launch. Dispatch launches once per click and prevent accidental duplicate submissions.

Website selection is temporary, not stored per account or between app runs. Do not implement presets, saved groups, or last-used website restoration. Keep the current selection during the current manager session until the user changes or clears it so they can apply it to other accounts. Catalog display order is persistent and independent of temporary launch order.

### Shared catalog management

Provide **Add a new website**, requiring a display name and launch URL, with automatic icon fetching. Allow editing, reordering, and removing both default and custom entries. These edits affect every account. Removing a catalog item does not erase its existing browser session or close its tabs.

Use a distinct catalog-edit mode or explicit controls so dragging a selected website changes launch order, while rearranging the catalog changes catalog display order. Do not confuse the two.

## 5. Default website catalog

Seed exactly these entries once on a fresh installation. They must appear in this order by default. Users may subsequently reorder them. Their initial prominence does not force them to open first.

| Initial position | Display name | Launch URL |
| --- | --- | --- |
| 1 | Steam | https://store.steampowered.com/ |
| 2 | CSFloat | https://csfloat.com/ |
| 3 | CSGOEmpire | https://csgoempire.com/roulette |
| 4 | CS.MONEY | https://cs.money/tr/market/sell/ |
| 5 | skins.com | https://skins.com/ |
| 6 | Lis Skins | https://lis-skins.com/ |
| 7 | 500casino | https://csgo500.com/ |
| 8 | CSGORoll | https://www.csgoroll.com/ |

Keep the explicitly supplied HTTP URL and port intact. Do not silently change URLs to guessed endpoints. Configuration records should use stable UUIDs rather than names as identifiers. Startup must not recreate entries that users intentionally removed.

### Website icons

Try suitable declared site icons and a conventional favicon fallback with bounded requests. Resolve relative icon URLs against the fetched document URL. Cache successful images locally. Treat icon failure separately from website validity.

If fetching fails, show: **“We couldn't fetch this website's icon. Please provide a PNG file.”** Include Upload PNG and allow saving with a placeholder so icon availability does not block launching. Allow replacement of an automatically fetched icon. Validate image type, size, and dimensions; decode/re-encode untrusted image data. Do not execute fetched HTML or SVG in the dashboard. Apply request timeouts, redirect limits, download size limits, and a safe URL-fetch policy; block privileged schemes and unintended local-network fetching. Support HTTP and HTTPS launch URLs, never shell commands or javascript: URLs.

## 6. Account onboarding and identity

1. User selects Add account.
2. Create a provisional account UUID and fresh persistent profile directory. Initialize required extensions and report individual failures accurately.
3. Open a visible browser window for that profile to Steam login.
4. User completes login and Steam Guard manually.
5. The companion detects the currently authenticated user's own Steam profile from a verified Steam page, resolves the canonical SteamID64, and fetches/displays the Steam name and avatar.
6. Save the confirmed identity and update the sidebar automatically. Offer an optional custom label without requiring it.

Never interpret an arbitrary visited public Steam profile as the logged-in account. Establish identity from the authenticated account's own-profile navigation/canonical page and test this distinction. Do not read or copy authentication cookies for metadata detection. Use an adapter for page parsing with fixtures and failure states because Steam markup can change. Use a documented API only when its actual authentication requirements are satisfied; do not embed a shared API key or assume public endpoints supply everything.

On detection failure, preserve the profile and show Retry detection and clear instructions to open the account's own profile. Do not silently bind an unverified SteamID64. Keep pending onboarding resumable after cancellation or restart. If the same SteamID64 is already registered, explain the duplicate and guide the user to the existing account without merging profile directories.

Store SteamID64 as TEXT/string throughout, including JSON and IPC, to avoid JavaScript integer precision loss. Cache metadata; refresh asynchronously when practical and on demand without blocking launch. A changed Steam name/avatar updates the cached metadata; a custom label remains unchanged. If the browser later logs into a different Steam account, show the identity mismatch and require explicit reconciliation rather than silently changing the account association.

## 7. Browser and tab behavior

### Fresh launch

Open all selected websites in one visible browser window for each selected account. Tabs appear left-to-right in the chosen order. Create tabs in deterministic order without waiting for each website to finish loading. Page requests may run concurrently. Activate the first requested tab. A single website selection opens just that website, without automatically adding Steam or unrelated defaults. Remove only an app-created unused blank bootstrap tab.

### Existing browser

Reuse the account's existing primary browser window. Add requested websites that are not already open. Reuse existing matching tabs without navigating or reloading them, preserving forms and current site state. Move the requested tabs to the beginning in selection order and keep unrelated tabs afterward in their prior relative order. Focus the primary window and first requested tab when supported by the OS. Window-manager focus restrictions should not be reported as launch failure.

For example, if Steam and CSFloat already exist and the request is CSFloat → CSGOEmpire → Steam, keep the existing CSFloat and Steam page state, add CSGOEmpire, and arrange those three requested tabs in that order.

Define deterministic website matching: normalized origin/explicit configured aliases by default; account for custom entries sharing an origin with different meaningful paths, queries, or ports. Do not match solely by title, substring, or registrable domain. In particular do not conflate arbitrary vercel.app sites. Preserve meaningful query strings. Prefer recorded tab-to-website associations while validating that the current URL still belongs to the expected site; avoid claiming that a generic Steam authentication tab represents every trading site. Test redirects and ambiguous matches. When uncertain, create a new tab rather than hijacking an unrelated page.

If several matching tabs already exist, reuse one deterministically and leave the others intact. User-created extra windows must not be closed. Use the tracked primary window when it exists, otherwise choose a normal window deterministically. A matching requested tab in another window may be moved to the primary window to fulfill the one-window launch requirement; never touch other account profiles or incognito windows.

### Lifecycle

One browser instance owns each account directory; never launch concurrent processes against the same profile. Serialize launch requests per account and limit multi-account startup concurrency. Reopening the manager reconnects to running account browsers and reconciles observed state; persisted PIDs alone are not proof of ownership or health.

Closing the manager leaves browser windows running. Browser launches must be detached correctly on Windows and Linux and must not inherit a kill-on-exit process group/job. Closing a browser saves profile data normally. Do not close persistent contexts as part of manager cleanup. On app relaunch, reconnect rather than launching duplicate browsers. Detect stale locks safely; do not delete active browser locks merely because a recorded PID is absent.

The manager provides accurate starting/open/closed/unavailable states and per-account launch results. One failed account does not cancel successful launches for others. Browser persistence is implemented by its normal profile storage, not copying cookies between profiles.

## 8. Required extension set

Install all eight extensions in every newly created profile. No optional-extension picker. Share immutable extension code assets where appropriate; each profile retains its own extension settings and authentication.

| Extension directory | Legacy extension ID | Source expectation |
| --- | --- | --- |
| betterfloat | bphfhlfhnohppnleaehnlfigkkccpglk | Publisher/store package |
| csmoney | mkjknmlmebnimmkonggecjlccealonel | Publisher/store package |
| cs2-trader | kaibcgikagnkfgjnibflebpldakfhfih | Publisher/store package |
| csfloat-market-checker | jjicbefpemnphinccgikpdaagjebbnhg | Publisher/store package |
| proton-vpn | jplgfhpmjnbigmhklmmbgecoobifkmpa | Publisher/store package |
| skinscom | inlmjddlgofjocncdogkelkfbgkecphn | Publisher/store package |
| trade-token-sync | kbcomfmcakpckijlmbkglflflmokhgof | Publisher/store package |
| csgoempire-quick-buy | daihhedcnbacghagnhoiafnkiegkdcmd | Supplied custom folder |

These IDs come from the old documentation; they are not newly verified listings. Verify actual availability, package authenticity, permissions, compatibility, and permitted distribution/update paths. Record a provenance/version manifest and integrity data. Do not fetch arbitrary repackaged extensions from unofficial mirrors. Check whether IDs remain stable when loading unpacked packages, especially for OAuth or external messaging integrations.

Use the selected Chromium runtime's supported extension-loading mechanism. For Quick Buy, validate the supplied folder contains manifest.json and referenced assets, then load it automatically where supported. The user permits developer mode when needed, but the goal is a functioning extension, not merely a toggled setting. Do not promise developer-mode UI changes if the selected runtime has no supported mechanism. Do not use global Chrome registry policies or system-wide policy files as the default architecture.

Inspect the custom extension's manifest version and APIs. If it requires obsolete Manifest V2, migrate the supplied source to Manifest V3 where feasible and validate equivalent behavior. Never freeze the browser on an insecure obsolete release just to retain an extension. If custom source is missing, report its expected folder and required assets; a placeholder is not a completed extension.

Automatic installation does not imply automatic login to Proton VPN or other extension services, nor automatic activation of VPN connections. Preserve whatever settings each user establishes in each profile.

Track extension states such as pending, installed, verified, failed, and incompatible with actionable retry/repair details. Verify running behavior, not just file existence or the presence of a service worker: not all extensions have the same background architecture. Do not mark setup fully successful while required extensions are missing. Allow clearly labeled partial/degraded use without hiding the failure. Stage updates safely and apply code changes at a safe browser restart, preserving per-profile settings. Browser and extension updates require compatibility checks; never mutate a running profile's extension assets in place.

## 9. Internal modules and data model

Recommended module structure:

- renderer/: React sidebar, website cards, temporary ordered selection, onboarding, settings, diagnostics.
- main/: Electron window lifecycle, validated IPC, local file dialogs, app single-instance behavior.
- domain/: Account, Website, ordered launch request, validation, typed results.
- services/accounts/: creation, deletion, custom labels, identity reconciliation.
- services/browser/: independent process launch, profile locks, primary-window registry, bridge reconnection.
- services/launch/: per-account queues, tab matching, ordering, partial-result aggregation.
- services/extensions/: runtime capability checks, package provisioning, verification, staged updates.
- services/metadata/: Steam own-account identity adapter, cached public display metadata.
- services/icons/: bounded fetch, decode, cache, uploaded PNG handling.
- persistence/: SQLite schema, transactions, repositories, migrations.
- companion-extension/: first-party MV3 tab and identity bridge.
- native-bridge/: packaged native messaging host and local IPC transport.
- packaging/: Windows/Linux installers, browser provisioning, licensing notices.
- tests/: unit, integration, browser, packaging smoke tests.

Suggested database entities:

| Entity | Important fields |
| --- | --- |
| accounts | id UUID, steam_id64 TEXT nullable/unique, steam_name, custom_label nullable, avatar_cache_path, profile_relative_path unique, onboarding_status, created_at, metadata_updated_at |
| websites | id UUID, display_name, launch_url, match_config, icon_cache_path, icon_source, catalog_position, created_at, updated_at |
| extension_packages | stable key, expected_id, actual_id, version, source, digest, package_relative_path, compatibility_status |
| account_extension_status | account_id, extension_key, installed_version, verified_at, status, error_code |
| settings | schema_version, catalog_seed_version, validated non-secret preferences |

Browser connection/window/tab identifiers are runtime state. If cached for reconnection, validate them against live observations. Do not persist temporary website selections or launch presets. SQLite migrations support future versions of this new app, not legacy imports.

Store data under platform-appropriate per-user application data/cache paths. Keep the database, browser profiles, cached metadata, runtime assets, and extension assets separated. Use UUID-based relative profile paths; renaming an account must not rename its directory. Do not store user data beside installed program files. Use bounded local logs with sensitive URLs/tokens redacted; never log browser cookies or passwords.

Protect Electron with context isolation, renderer sandboxing, disabled renderer Node integration, strict IPC validation, and a local-content CSP. Pass browser launch arguments as an argument array, never a shell-interpolated command. Expose only required bridge actions and Steam-specific metadata access; arbitrary website scripts must not invoke privileged manager operations.

## 10. Deletion and recovery

Deleting an account requires a clear confirmation explaining that it removes that account's local website sessions and browser data, not the real Steam account. If its browser is running, ask the user to close it or explicitly choose a graceful close before deletion. Validate that the path is a managed profile owned by that account before removing it. Handle partial deletion/database errors truthfully and preserve repair information. Never recursively delete paths outside managed storage.

A missing profile is visible as a repairable error, not silently hidden. Invalid database records and offline metadata requests should not crash the app. Pending account creation is resumable or removable. Runtime download failures provide retry and retain validated completed data; do not show successful installation on a partial download.

## 11. Installation and distribution

Windows: provide a normal installer, Start menu entry, and desktop shortcut, with bundled application runtime and no separate Python, Node.js, or developer tools required. Prefer per-user installation.

Linux: provide AppImage and .deb builds initially, a desktop entry, and clear runtime dependency handling. State tested distributions/versions; do not claim universal distribution support. Support a mainstream supported Ubuntu LTS target and test X11/Wayland behavior as applicable. Native messaging paths and browser survival after manager exit must be tested in packaged builds.

Initial setup automatically provisions the compatible browser and extension assets. A controlled first-run download is acceptable with honest progress, retry, authenticity checks, and clear connectivity requirements. Do not require users to manually run setup.bat/setup.sh, pip, or Playwright installation commands. Keep third-party notices and document runtime/extension update responsibility.

Uninstall removes application components while preserving account data by default; offer an explicit user choice for removing profiles. Updating the app preserves profiles and the shared catalog. Never shut down unrelated browsers or overwrite the user's normal Chrome profile/policies.

## 12. Implementation sequence and release gates

1. Inspect supplied repository/assets; record missing inputs and supported runtime target.
2. Build a minimal browser/extension proof on Windows and Linux: create two isolated profiles; load the custom extension plus representative required extensions; demonstrate tab ordering, native messaging, identity detection, and browser survival after manager exit.
3. Verify all eight extension packages individually, including identities and runtime behavior. Record blockers rather than assuming the old IDs/flags work.
4. Implement persistence, account onboarding, metadata caching, and shared catalog CRUD.
5. Implement the dashboard and deterministic temporary selection flow.
6. Implement full multi-account launch, existing-tab reuse/reordering, and reconnection.
7. Package and exercise fresh installation, restart, failure recovery, and update behavior.
8. Deliver source, installers/build instructions, README, architecture notes, compatibility matrix, test results, and specific remaining limitations.

Minimum acceptance cases:

- Fresh install shows the exact app name, no terminal, and the eleven seeded websites with the specified first three.
- Manual Steam login populates the correct account identity; visiting somebody else's profile does not rebind it.
- SteamID64 remains an exact string through database/UI/IPC round trips.
- Custom labels survive metadata refreshes and Steam name changes.
- Steam → CSGOEmpire → CSFloat opens one window with three ordered tabs.
- skins.com alone opens no unrelated default websites.
- Clicking a card changes selection only; removal/reordering updates numeric badges.
- Two accounts receive the same website sequence in separate isolated browser windows.
- All websites reuse each account's browser-managed sessions across browser and manager restarts when those sessions remain valid.
- Existing matching tabs are reused without reload and ordered correctly; unrelated tabs retain relative order.
- Same-origin custom paths, redirects, duplicate matches, pinned tabs, user-created extra windows, and concurrent launch clicks have deterministic tested behavior. Requested tabs may need unpinning to satisfy exact ordering; document and test this rather than silently ignoring order.
- Closing/reopening the manager leaves browsers alive and reconnects without duplicate instances on both platforms.
- No website selection is restored after manager restart; catalog edits persist globally.
- Icon fetch failure requests PNG upload and permits a placeholder.
- All eight required extensions have individually evidenced install/functional status on each supported platform. Missing source is explicitly reported.
- No Always Online, Discord, screenshots, legacy migration, cookie-copying, or system-wide Chrome policy side effects remain.

Use focused automated tests for selection order, matching, IDs, validation, and transactional failures. Use real browser tests for isolation, bridge behavior, tab state preservation, and process lifecycle. Distinguish mock tests from manual website/extension verification. Test authenticated third-party flows only with user-provided accounts and manual authentication. Do not claim working authentication based solely on public pages loading.

## 13. Technical evidence and limits

Architecture selected on 7 September 2026. These sources support the browser decision; they do not verify the eight third-party extensions or the implementation described above.

- Electron documents partial Chrome extension API support: https://www.electronjs.org/docs/latest/api/extensions/
- Playwright recommends its Chromium distribution for extension side-loading after Chrome/Edge removed required flags: https://playwright.dev/docs/chrome-extensions
- Chromium extension team announcement on removal of --load-extension from branded Chrome: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY
- Chrome tabs API provides tab creation and rearrangement: https://developer.chrome.com/docs/extensions/reference/api/tabs
- Native messaging provides extension/native application communication: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging

The external Chromium + companion/native bridge design is an engineering recommendation derived from those capabilities. Its complete packaging and eight-extension compatibility must be demonstrated during implementation. Automatically enabling an obsolete or incompatible extension cannot be guaranteed by documentation alone.

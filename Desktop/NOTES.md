# Steam Account Manager App

Windows and Linux desktop application for isolated, persistent Chromium account profiles and a shared website catalog. Run the commands below from `Desktop/`. See the [unified README](../README.md) for release and platform verification status.

## Run

Use `release/Steam Account Manager App-Setup-1.1.0.exe` for the per-user Windows installer, or run `release/win-unpacked/Steam Account Manager App.exe`. Chromium, the native messaging executable, Electron, SQLite, and the eight supplied extensions are included. No separate Node or Python installation is required for these packaged builds.

For source development:

```text
npm ci
npm run build:native
npm run build
npm start
```

If the browser is not bundled, account setup downloads the pinned Playwright Chromium build automatically into per-user storage. Setup progress and retry errors appear in the dashboard. Linux builds must be produced on Linux with `packaging/linux-build.sh`; see the root README for current verification and `LIMITATIONS.md` for historical validation gates.

## Use

1. Add an account and complete Steam login/Steam Guard manually in its browser. Never enter passwords in the manager.
2. Open your own Steam profile through Steam's account menu. Identity detection updates the pending account automatically when Steam's markup is recognized. Use **Retry / refresh identity** if needed.
3. Click an account row for a sole target, or use checkboxes for several accounts. Click website cards to select the tab sequence. Drag the selection strip or use its arrow buttons to reorder it.
4. **Open selected websites** creates or reuses tabs in each account's browser. Matching tabs keep their page state. Website selection stays only for this manager session.
5. **Manage catalog** adds, edits, removes and reorders shared entries. Failed icons can be replaced with PNG uploads; placeholders never prevent launch.
6. **Setup & diagnostics** reports package digests and exact enabled extension IDs for the selected browser. Installed/loaded does not mean authenticated functionality has been verified.

Closing the manager leaves account browsers running. Closing all windows for an account exits its browser normally and saves its website sessions. Existing sessions can still expire or be revoked by websites.

In an already-open account browser, exact ordering unpins tabs in the primary window. Matching requested tabs can move in from another normal window; if moving its last tab, a blank tab preserves that source window. When reopening a closed account browser, only the requested websites remain open; restored session and pinned tabs are closed. Cookies and extension settings are preserved. The companion automatically dismisses BetterFloat and Proton VPN's exact `onboarding.html` pages.

Delete requires a native confirmation and a closed account browser. It removes local browser sessions, not the Steam account. Interactive Windows uninstall asks whether to erase all local app data; keeping it is the default. Linux removal and AppImage cleanup are described in the [unified README](../README.md#uninstalling-desktop-builds). Updates and unattended uninstall keep data.

## Data and security

Windows data: `%APPDATA%/SteamAccountManagerApp`. Linux data: `$XDG_CONFIG_HOME/SteamAccountManagerApp` or `~/.config/SteamAccountManagerApp`.

SQLite, UUID profile directories, image cache, immutable extension versions, and Chromium runtime are separate. Each profile has its own browser-managed cookies, site storage and extension state. No legacy import, cookie export, credentials, trading automation, Always Online, monitoring screenshots, or Discord integrations are implemented by the manager.

The trusted Electron dashboard is sandboxed with context isolation and a restricted preload API. Websites open only in external Chromium. The native host uses an authenticated local pipe/socket and a per-account capability. It has no public control port. Windows registration uses only the user's native-messaging registry entry; no global Chrome policies are set.

## Verification commands

```text
npm run typecheck
npm test
npm run test:database
npm run test:smoke
npm run test:browser
npm run test:tabs
npm run package:win
npm run test:packaged
```

Browser tests create temporary profiles and use local/synthetic pages. They do not log into your Steam accounts. `test:tabs` uses Playwright-owned test contexts strictly for diagnostics; production browsers are detached processes. See `TEST-RESULTS.md`, `ARCHITECTURE.md`, and `LIMITATIONS.md` for evidence and remaining release gates.



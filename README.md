[](https://github.com/D4gkan/Steam-Desktop-Authenticator-2.0#%EF%B8%8F-read-this-before-you-do-anything-else)

<div align="center">
  <img src="logo.png" alt="Steam Account Manager App logo" width="180">
  <br>
   <h1>Steam Account Manager App</h1>
   <small><em><font color="#6e7781">This project is not affiliated with, sponsored by, or endorsed by Valve Corporation or Steam. It is an independent, community-run tool.</font></em></small>
</div>

<p align="center">
   <a href="https://github.com/D4gkan/Steam-Account-Manager-App/releases/tag/v1.1.0"><img src="https://img.shields.io/badge/version-v1.1.0-2ea44f" alt="Current version v1.1.0"></a>
  <a href="#supported-platforms"><img src="https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20Android-2ea44f" alt="Supported platforms"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
</p>

Steam Account Manager App helps you manage multiple Steam accounts from one place. Its intended use is to manage multiple Steam accounts across various websites, mainly for trading and marketplace workflows.

Each account gets its own persistent browser profile. That keeps cookies, website sessions, local storage, and supported extension state separated, so you can work with several accounts without mixing their sessions. The app does not automate trades, bypass Steam security, or replace Steam Guard: you sign in and confirm security prompts yourself.

## Table of contents

- [What you can do](#what-you-can-do)
- [How it works](#how-it-works)
- [Supported platforms](#supported-platforms)
- [Installation](#installation)
- [Using the app](#using-the-app)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Known limitations](#known-limitations)
- [Privacy and local data](#privacy-and-local-data)
- [Uninstalling](#uninstalling)
- [Build from source](#build-from-source)
- [Repository layout](#repository-layout)
- [Contributing](#contributing)
- [License](#license)

## What you can do

- Create and manage separate profiles for multiple Steam accounts.
- Open the same set of trading and marketplace websites for one account or several accounts at once.
- Select the websites you need and control the order in which their tabs open.
- Reuse existing browser tabs and sessions instead of logging in again every time.
- Keep account browser data persistent between app launches.
- Detect the Steam identity in an account browser after you open your Steam profile.
- Add, edit, remove, and reorder entries in the shared website catalog.
- Add website icons, with placeholders available when an icon cannot be fetched.
- Use bundled browser extensions for supported workflows, including BetterFloat, CS.Money, CS2 Trader, CSFloat Market Checker, Proton VPN, Skins.com Marketplace, Trade Token Sync, and CSGOEmpire Quick Buy.
- Inspect extension package information and diagnostics from the desktop app.
- Lock the Android app with a PIN or biometric authentication.
- Keep Android website sessions isolated per account and website.

The desktop app uses Electron and Chromium. The Android app uses GeckoView and keeps its browser profiles separate from the desktop app. Desktop and Android sessions are independent, so you may need to sign in again when moving between them.

## How it works

This section summarizes the desktop trust model at a high level; see [`Desktop/ARCHITECTURE.md`](Desktop/ARCHITECTURE.md) for the full technical breakdown.

- **Manager dashboard.** The desktop app is an Electron shell hosting a local React dashboard. The renderer runs with Node integration disabled and context isolation/sandboxing enabled, so page content in the dashboard itself can't reach the filesystem or OS directly — it talks to the app only through a small, fixed set of validated IPC methods.
- **Per-account browsers.** Each account's browser window is a separate, detached Chromium process (via Playwright) with its own user-data directory, so cookies, local storage, and extension state never leak between accounts. Production builds don't open a remote debugging port.
- **Native bridge.** A small companion process relays a limited set of allowlisted, authenticated requests between the account browser's extension and the manager (for example, tab discovery/creation for the "open selected websites" workflow). It doesn't expose a general automation API to websites.
- **Identity detection.** When you open your own Steam profile inside an account browser, a content script reads the metadata Steam serves for *your own* authenticated profile view and reports back a Steam ID for that browser. It does not read cookies, run arbitrary scripts, or act on a profile that isn't your own.
- **Local storage.** Account, website-catalog, and extension metadata live in a local SQLite database with migrations and integrity checks. Extensions are staged by content digest into per-user directories and are not silently overwritten while a browser is running.

The practical takeaway: the manager orchestrates browser windows and tabs, but every sign-in, Steam Guard prompt, and trade confirmation happens inside the normal website UI, under your control.

## Supported platforms

| Platform | Release | Requirements |
| --- | --- | --- |
| Windows 10/11, x64 | `v1.1.0` | A normal desktop Windows installation |
| Linux, x64 | `v1.1.0` | A Debian/Ubuntu-compatible desktop for `.deb`, or a compatible AppImage environment |
| Android 9 or newer | `v1.1.0` (version code 2) | Internet access for website sign-ins |

Download the latest installers from [GitHub Releases](https://github.com/D4gkan/Steam-Account-Manager-App/releases/latest). The files currently available for v1.1.0 are:

- Windows: `Steam Account Manager App-Setup-1.1.0.exe`
- Linux: `steam-account-manager-app_1.1.0_amd64.deb` or `Steam Account Manager App-1.1.0.AppImage`
- Android: `SAMApp-v1.1.0.apk`

## Installation

### Windows

1. Download `Steam Account Manager App-Setup-1.1.0.exe` from the [v1.1.0 release](https://github.com/D4gkan/Steam-Account-Manager-App/releases/tag/v1.1.0).
2. Run the installer. It is a per-user installer, so administrator access is normally not required.
3. Choose an installation directory and let the installer create the Start Menu and desktop shortcuts.
4. Open Steam Account Manager App and add your first account.
5. Complete Steam login and Steam Guard in the account browser window. Do not enter your Steam password into the manager itself.

The Windows installer is currently not code-signed, so Windows SmartScreen may show an extra confirmation. Confirm the publisher and file source before continuing.

### Linux

#### Debian or Ubuntu

1. Download `steam-account-manager-app_1.1.0_amd64.deb` from the [v1.1.0 release](https://github.com/D4gkan/Steam-Account-Manager-App/releases/tag/v1.1.0).
2. Open a terminal in the download directory.
3. Install the package:

   ```bash
   sudo apt install ./steam-account-manager-app_1.1.0_amd64.deb
   ```

4. Start the app from your application menu, or run:

   ```bash
   steam-account-manager-app
   ```

#### AppImage

1. Download `Steam Account Manager App-1.1.0.AppImage` from the [v1.1.0 release](https://github.com/D4gkan/Steam-Account-Manager-App/releases/tag/v1.1.0).
2. Open a terminal in the download directory and make it executable:

   ```bash
   chmod +x "Steam Account Manager App-1.1.0.AppImage"
   ```

3. Launch it:

   ```bash
   ./"Steam Account Manager App-1.1.0.AppImage"
   ```

The Linux build is intended for x64 desktop systems. If the AppImage does not start, try the Debian package on a compatible Debian or Ubuntu system and check that your desktop has the libraries and sandbox support required by Electron and Chromium. Ubuntu 24.04 LTS is the primary target environment; other distributions may need additional system libraries installed manually.

### Android

1. Download `SAMApp-v1.1.0.apk` from the [v1.1.0 release](https://github.com/D4gkan/Steam-Account-Manager-App/releases/tag/v1.1.0).
2. Open the APK on your Android device.
3. If Android asks, allow your browser or file manager to install apps from that source.
4. Confirm the installation and open Steam Account Manager App.
5. Create an account profile, then sign in to Steam and each website inside its own session.
6. Set a PIN or enable biometrics from the app security settings if you want to protect the manager when it is closed.

You can also install the APK with Android Debug Bridge:

```bash
adb install SAMApp-v1.1.0.apk
```

Version 1.1.0 uses a new Android release signing key. If you are upgrading from an older release, uninstall the old APK first. Android will remove that app's local data and sessions when it is uninstalled.

## Using the app

### Desktop workflow

1. Select **Add account** and give the account a recognizable name.
2. Open the account browser and complete Steam sign-in and Steam Guard manually.
3. Open the Steam profile for that account. The manager uses the detected Steam identity to associate the browser with the account; use **Retry / refresh identity** if necessary.
4. Select one or more account rows.
5. Select the websites you want to open. Reorder the selection strip with drag and drop or its arrow controls.
6. Choose **Open selected websites**. The manager creates or reuses the requested tabs for each selected account.
7. Close the dashboard when you are finished. Account browsers can continue running, and their sessions remain available the next time you open the manager.

Multi-account launches are processed up to two accounts at a time, and the manager will not let you submit overlapping launch requests for the same account.

### Android workflow

Android stores local account information and a separate GeckoView browser profile for each account and website pair. Give each profile a clear name, open the websites you need, and complete their sign-ins inside the correct account session. Steam sign-in and marketplace sign-ins remain separate, and desktop browser sessions cannot be migrated automatically to Android.

### Important session notes

- The manager never asks for or stores Steam passwords. Enter credentials only on the official Steam or website sign-in page.
- Existing sessions can expire or be revoked by Steam or third-party websites.
- Deleting an account removes local browser data and sessions; it does not delete the Steam account.
- Closing the manager does not automatically close desktop account browser windows.
- Extensions being installed or loaded does not guarantee that a third-party website is authenticated or working.
- The app does not provide trade automation, cookie export, credential export, or an Always Online feature.

## Troubleshooting & FAQ

**Windows shows a SmartScreen warning when I run the installer.**
The installer isn't code-signed, so this is expected. Verify you downloaded it from the [official Releases page](https://github.com/D4gkan/Steam-Account-Manager-App/releases) before choosing "Run anyway."

**The AppImage won't launch on Linux.**
Confirm your system has the sandbox and shared-library support that Electron/Chromium expect, and that you're on an x64 desktop environment. If it still fails, try the `.deb` package on a Debian/Ubuntu-based distro instead.

**The manager isn't detecting my Steam identity for an account.**
Make sure you've opened *your own* Steam profile page (not someone else's) inside that account's browser window while signed in, then use **Retry / refresh identity**. Identity detection only reads the authenticated profile view Steam serves to you — it won't associate a browser with a profile you haven't actually opened while logged in.

**A website session keeps logging me out.**
Sessions are controlled by Steam or the third-party site, not by the manager — they can expire or be revoked independently, and you'll need to sign in again when that happens.

**Can I export cookies or session tokens?**
No. There is no cookie export, credential export, or trade-automation feature by design.

**Do desktop and Android share sessions?**
No. Desktop uses Electron/Chromium profiles and Android uses separate GeckoView profiles; the two are not linked, so expect to sign in again on each platform.

## Known limitations

The project is functional but pre-1.2 validation is still in progress. Details are tracked in [`Desktop/LIMITATIONS.md`](Desktop/LIMITATIONS.md); highlights:

- **Linux is less battle-tested than Windows.** The Linux native-host binary builds successfully but hasn't been exercised on a real Linux machine yet, and packaging is only validated to the point of producing installers — end-to-end behavior (native messaging lookup, window-manager focus handling, upgrades) on Linux is still unverified.
- **Extensions are loaded, not deeply verified.** The bundled extensions have been confirmed to load with the correct IDs/versions in the Windows Chromium runtime, but their authenticated behavior against each vendor's live site, OAuth flow, or VPN login hasn't been independently verified for every extension. The manager does not automate logins, VPN activation, trades, purchases, or wagers for you.
- **No signed installers yet.** The Windows installer is currently unsigned, and there is no automatic update mechanism for the bundled Chromium/Playwright/Electron runtime or for extensions — updates ship as new application releases.
- **Identity detection needs a live, authenticated session.** Automated tests cover synthetic Steam profile fixtures; real authenticated Steam markup and Steam Guard flows still require you to verify sign-in yourself.

None of this affects the core safety model (no password storage, no trade automation), but it's worth knowing before relying on the app for anything critical.

## Privacy and local data

Desktop data is stored locally at `%APPDATA%/SteamAccountManagerApp` on Windows and at `$XDG_CONFIG_HOME/SteamAccountManagerApp` or `~/.config/SteamAccountManagerApp` on Linux. Android data is managed by Android's app storage.

The app uses isolated local browser profiles, SQLite, and a restricted Electron preload API. It does not send your Steam password to the manager. Nothing is uploaded to a remote server operated by this project — all account, session, and catalog data stays on your device. Review the [desktop architecture](Desktop/ARCHITECTURE.md), [limitations](Desktop/LIMITATIONS.md), and [third-party notices](Desktop/THIRD-PARTY-NOTICES.md) for more detail.

## Uninstalling

- **Windows:** uninstall from Windows Settings or the app's uninstaller. The prompt lets you keep or erase local account browsers, cookies, extension settings, and cached data. Keeping data is the default.
- **Debian/Ubuntu:** remove the package through your package manager. Use the included `uninstall-linux.sh` helper when you also want to choose whether local data should be erased.
- **AppImage:** deleting the AppImage does not remove app data. Download `uninstall-linux.sh` from the release and run `bash uninstall-linux.sh --appimage "/absolute/path/Steam Account Manager App-1.1.0.AppImage"`.
- **Android:** uninstalling the app removes its local data and sessions.

Close the manager and all account browser windows before erasing data. If you only want to remove one account's sessions rather than everything, delete that account from inside the manager first — there is no separate bulk-profile-deletion option at uninstall time.

## Build from source

Source builds are intended for contributors and developers. Packaged releases already include Electron, Chromium, SQLite, the native bridge, and the supplied extensions.

### Desktop development

Requirements: Node.js/npm and a graphical desktop. Run from `Desktop/`:

```bash
npm ci
npm run build:native
npm run build
npm start
```

For a Linux package, build on Linux from `Desktop/`:

```bash
bash packaging/linux-build.sh
```

For Windows packaging, use PowerShell from `Desktop/`:

```powershell
npm ci
npm run package:win
```

Useful checks are `npm run typecheck`, `npm test`, `npm run test:database`, and `npm run test:browser`.

### Android development

Requirements: JDK 21 and Android SDK 36. Run from `Mobile/`:

```bash
./gradlew testDebugUnitTest lintDebug assembleDebug
./gradlew assembleRelease
```

On Windows, use `gradlew.bat` instead of `./gradlew`. Release signing requires the `SAMAPP_RELEASE_*` environment variables or a local, ignored `Mobile/keystore.properties` file. Never commit signing keys or passwords.

## Repository layout

```
Steam-Account-Manager-App/
├─ Desktop/            Electron + React desktop app, native bridge, packaging scripts
│  ├─ ARCHITECTURE.md  Technical breakdown of the trust model described above
│  ├─ LIMITATIONS.md   Current validation gaps, per platform
│  └─ THIRD-PARTY-NOTICES.md  Licenses for bundled runtimes/extensions
├─ Mobile/             Android app (GeckoView-based)
├─ logo.png
├─ LICENSE             MIT license for this project's own code
└─ README.md
```

## Contributing

Found a bug, have a feature idea, or need support for another website? Please [open an issue](https://github.com/D4gkan/Steam-Account-Manager-App/issues) with clear reproduction steps, your operating system, app version, and relevant logs. Do not include Steam passwords, session cookies, access tokens, or private account information.

For code, documentation, translations, and new features, feel free to open a [pull request](https://github.com/D4gkan/Steam-Account-Manager-App/pulls). Keep changes focused, explain the user-facing benefit, and include tests or verification steps where practical.

## License

The app's own code is released under the [MIT License](LICENSE). Bundled libraries, browser runtimes, and extensions retain their own licenses; see [third-party notices](Desktop/THIRD-PARTY-NOTICES.md).
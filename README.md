# Steam Account Manager App

<img src="logo.png" alt="Steam Account Manager App logo" width="180" />

One product, shipped as two separate builds: a Windows/Linux desktop app with persistent Chromium account profiles, and an Android app with isolated GeckoView website sessions. Both use the same branding and release version; their codebases and build tools remain separate.

| Platform | Version | Purpose |
| --- | --- | --- |
| Desktop — Windows / Linux | 1.1.0 | Manage isolated Steam account browser profiles and open an ordered selection of shared websites with bundled Chromium extensions. |
| Mobile — Android | 1.1.0 (version code 2) | Manage isolated account/website sessions in GeckoView, with consent-based Firefox extensions and PIN/biometric app lock. |

Download installers from [GitHub Releases](https://github.com/D4gkan/Steam-Account-Manager-App/releases/tag/v1.1.0). This is an unofficial app, unaffiliated with Valve or Steam. Sign in and complete Steam Guard yourself; the desktop manager does not ask for Steam passwords or automate trades.

## Desktop (Windows / Linux)

Source: [Desktop](Desktop/). Entry point: `Desktop/src/main/index.ts`; Electron runs the compiled `dist/main/main/index.js`.

The Electron/React dashboard manages a shared website catalog and one persistent Chromium profile per account. Browser cookies, site storage, and extension state remain separate. Closing the manager leaves account browsers running; reopening it reconnects to them. Existing sessions can still expire or be revoked by websites.

### Requirements and installation

- Windows x64: run `Steam Account Manager App-Setup-1.1.0.exe`. This is a per-user installer and is not code-signed.
- Linux x64: use the `.deb` on a compatible Debian/Ubuntu desktop, or the `.AppImage`. Linux packages must be built on Linux so native libraries and executable permissions match the platform.
- Packaged builds include Electron, Chromium, SQLite, the native bridge, and eight supplied extensions. A separate Node.js installation is not needed to run them.
- Source builds require Node.js/npm. Node 22 was used for Linux builds; Node 25.2.1 was used on Windows. Native compilation may require the platform's C/C++ build tools when a prebuilt dependency is unavailable.
- A graphical desktop and Chromium/Electron system libraries are needed on Linux. The Debian package declares its runtime dependencies. AppImage users must have compatible system libraries and sandbox support.

Linux installation/run examples:

```bash
sudo apt install ./steam-account-manager-app_1.1.0_amd64.deb
steam-account-manager-app

# Or use the portable AppImage:
chmod +x "Steam Account Manager App-1.1.0.AppImage"
./"Steam Account Manager App-1.1.0.AppImage"
```

### Build and run from source

Run these commands from `Desktop/`:

```bash
npm ci
npm run build:native
npm run build
npm start
```

If Chromium is not bundled, account setup downloads the pinned Playwright runtime into this app's per-user storage. To bundle Chromium before packaging:

```powershell
# Windows PowerShell, from Desktop/
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/resources/runtime"
npx playwright-core install chromium
npm run package:win
```

```bash
# Linux, from Desktop/; installs dependencies/runtime, tests, and packages:
bash packaging/linux-build.sh
```

Output: `Desktop/release/`. The Linux script produces an AppImage and a Debian package. Useful checks include `npm run typecheck`, `npm test`, `npm run test:database`, `npm run test:smoke`, `npm run test:browser`, and `npm run test:packaged` (Windows executable by default).

### Uninstalling desktop builds

**Windows:** uninstall through Windows Settings or the installed uninstaller. It asks whether to erase this Windows user's saved accounts, browser sessions/cookies, extension settings, and cached files. **No / keep data is the default.** Close all account browsers before choosing to erase. Updates and silent uninstall preserve data. Linked paths or data still in use are preserved with an error message.

**Linux Debian package:** interactive removal asks about the invoking user's data when the package manager supplies the user identity and a terminal or supported graphical prompt is available. Updates, unattended removal, and removal without an identifiable desktop user preserve data. Other users' data is not deleted.

**Linux AppImage:** deleting an AppImage directly cannot display an uninstall prompt. Download `uninstall-linux.sh` from the release and use the helper to remove the file and choose whether to erase your data:

```bash
bash uninstall-linux.sh --appimage "/absolute/path/Steam Account Manager App-1.1.0.AppImage"

# Also usable after removing the Debian package; asks before erasing data:
bash uninstall-linux.sh --data-only
```

Run the helper as your desktop user, with your usual `XDG_CONFIG_HOME` if customized. It uses Zenity or KDialog when available, or asks you to type `ERASE` in a terminal. With no prompt available it keeps data. Keep the AppImage path absolute. Close the manager and account browsers first. This only erases local app data, never the Steam account itself.

Data locations: `%APPDATA%/SteamAccountManagerApp` on Windows; `$XDG_CONFIG_HOME/SteamAccountManagerApp` or `~/.config/SteamAccountManagerApp` on Linux. Custom `--user-data-dir` test/development directories are not erased by uninstall.

For usage and architecture details, see [Desktop notes](Desktop/NOTES.md), [architecture](Desktop/ARCHITECTURE.md), and [third-party notices](Desktop/THIRD-PARTY-NOTICES.md). Earlier validation limitations remain in [LIMITATIONS.md](Desktop/LIMITATIONS.md); the current results are below.

## Mobile (Android)

Source: [Mobile](Mobile/). Launcher: `Mobile/app/src/main/java/com/steamaccountmanager/app/MainActivity.kt`; application setup: `SteamAccountManagerApp.kt` in the same directory.

The Kotlin/Compose app uses local account metadata and a distinct GeckoView browser profile for each account/website pair. It supports the official Firefox CSFloat, CS.MONEY, and Skins.com packages with explicit session consent, plus PIN and biometric locking. Steam sign-in is separate from marketplace sign-ins. Existing WebView sign-ins cannot migrate to GeckoView; users must sign in again.

### Requirements and build

- Android 9+ (minimum SDK 28), with internet access for website sign-ins.
- Build with JDK 21 and Android SDK 36; target SDK is 35.
- Set `JAVA_HOME` and `ANDROID_HOME` to your local installations.

Run from `Mobile/`:

```bash
./gradlew testDebugUnitTest lintDebug assembleDebug
./gradlew assembleRelease
```

On Windows, use `./gradlew.bat` instead. Outputs are in `Mobile/app/build/outputs/apk/`. Debug builds have application ID `com.steamaccountmanager.app.debug`; release uses `com.steamaccountmanager.app`.

Release signing uses the existing `SAMAPP_RELEASE_STORE_FILE`, `SAMAPP_RELEASE_STORE_PASSWORD`, `SAMAPP_RELEASE_KEY_ALIAS`, and `SAMAPP_RELEASE_KEY_PASSWORD` environment variables, or ignored `Mobile/keystore.properties` (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`). Keep the signing key and passwords outside Git. Without signing configuration Gradle produces an unsigned APK, which is not the downloadable signed release.

### Install

Download `SAMApp-v1.1.0.apk`, allow installation from the chosen source if Android requests it, and install. Alternatively:

```bash
adb install SAMApp-v1.1.0.apk
```

**v1.1.0 uses a new release signing key. Uninstall the old release APK before installing this one. Uninstalling Android removes that app's local data and sessions.** Future releases should reuse this new signing key to support in-place updates.

See [Mobile notes](Mobile/NOTES.md), the [architecture/upgrade contract](Mobile/docs/adr/0001-adopt-geckoview-for-csfloat.md), and [manual acceptance checklist](Mobile/docs/manual-testing/geckoview-final-release.md). Authenticated vendor-site behavior and physical-device acceptance still require manual checks; emulator startup does not establish those claims.

## v1.1.0 verification

- Windows: type checks and 49 unit/cleanup tests passed; database and dashboard smoke checks passed. The browser lifecycle test passed for two isolated profiles, tab order/reuse, reconnecting after the manager exits, and browser-restart cookie persistence. The final packaged executable passed its smoke test, including the native host, all eight extensions, site launch, and manager restart/reconnection.
- Linux: native AppImage and Debian builds passed in Ubuntu under WSL2, as did type checks, 50 unit/cleanup tests, and SQLite checks. The packaged dashboard launched as a non-root user with the Chromium sandbox enabled. The final packaged smoke test passed for SQLite, IPC, the native host, all eight extensions, site launch, and manager restart/reconnection. WSL verification does not certify every X11/Wayland desktop or distribution.
- Android: 74 JVM tests, lint (0 errors, 127 warnings, 3 hints), debug and signed release builds passed. The signed release APK installed and launched on the emulator; 12 selected instrumentation tests passed. Existing build warnings include Room schema export configuration and Kotlin/R8 metadata compatibility.
- Cleanup checks use disposable fixtures and verify that declining/noninteractive removal keeps data, consent erases only the app directory, and linked roots/targets are preserved. Windows graphical installer prompts and every Linux package-manager GUI still require manual acceptance.
- The existing desktop packaged smoke check expected 11 catalog entries instead of 8; its assertion was corrected. Chromium could exit before connecting its companion when launched without a window. The approved fix starts a blank window and lets the existing `start_fresh` logic replace its tabs.
- Linux packaging now unpacks the image-processing library's native dependencies so the dynamic loader can find libvips. Native bridge manifests are written inside each account's browser data directory, matching Chromium's Linux lookup path. The package homepage is set for Debian packaging.
- Real Steam/Steam Guard sign-ins and authenticated third-party extension behavior were not exercised in this release verification. Historical extension provenance files record earlier inspections; documentation files named `README.md` were renamed to `NOTES.md` during consolidation, so historical package digests are not claims about the renamed tree.

## Repository structure

```text
Steam Account Manager App/
├── README.md
├── logo.png
├── LICENSE
├── Desktop/       # Electron / TypeScript / React, Windows and Linux
└── Mobile/        # Kotlin / Compose / GeckoView, Android
```

The existing Android Git history is preserved; its project now lives in `Mobile/`. Existing uncommitted Mobile work was retained and is included in the tested APK. Both original app icons remain in place for packaging. This is the only repository README; platform-specific documentation is retained as `NOTES.md`. Dependencies, downloaded runtimes, build outputs, and signing credentials are ignored.

## License

Both apps' own code is covered by the [MIT License](LICENSE), copyright 2026 Steam Account Manager contributors. Bundled libraries, browser runtimes, and extensions retain their own licenses and notices; see [third-party notices](Desktop/THIRD-PARTY-NOTICES.md). Applying MIT to the apps does not relicense third-party packages.

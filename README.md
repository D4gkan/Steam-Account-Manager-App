<div align="center">
  <img src="app-icon.png" alt="Steam Account Manager icon" width="180" height="180" />
  <br>
  <img src="https://img.shields.io/badge/version-v1.0.0-blue" alt="Version v1.0.0" />
  <br>
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android" alt="Made for Android" />
  <br><br>
  <h1>Steam Account Manager</h1>
</div>

## ⚠️ Important Disclaimer

**Steam Account Manager is an unofficial, third-party application and is NOT affiliated with, endorsed by, or associated with Valve Corporation or Steam.** This application is provided as-is for educational and personal use. Users assume all responsibility and risk when using this application. The developers are not liable for any account losses, security incidents, or violations of Steam's Terms of Service. Use at your own risk.

---

Steam Account Manager is an Android APK application for securely managing multiple Steam accounts and Steam-related browsing sessions in a local, isolated environment.

## Overview

Steam Account Manager is designed to keep separate Steam sessions isolated per account while allowing a user to manage multiple accounts and related websites from one Android app. It stores local metadata on-device and keeps browser state isolated so cookies, login sessions, and website storage do not leak between accounts.

## Features

- Multiple Steam accounts in one app
- Per-account website session isolation
- Persistent GeckoView browser sessions for every supported website
- Official Firefox CSFloat, CS.MONEY and Skins.com extensions with explicit per-session consent
- Local app lock with PIN and biometric support
- Website selection flow for Steam-related sites
- Account ordering and management
- Local-only storage model for account metadata

## Version

- Version: v1.0.0
- Platform: Android APK
- Minimum Android: 9+ (API 28+)

## Requirements

- Android 9 or newer
- APK installation on a compatible device or emulator
- Internet access for Steam and website sign-in flows

## Download

Published builds belong on [GitHub Releases](https://github.com/D4gkan/Steam-Account-Manager-App/releases).
The GeckoView campaign candidate is awaiting final device acceptance; its exact build
and local APK hashes are listed in the [verification receipt](docs/verification/geckoview-issue-12-emulator-run.md).

## Installation

1. Download a published APK from GitHub Releases, or use the supplied local campaign test APK.
2. Enable installation from unknown sources on your Android device if needed.
3. Install the APK and launch the app.

## Build Instructions

Use Android Studio's bundled JDK 21 (verified with 21.0.8) and Android SDK 36. Set `JAVA_HOME` and `ANDROID_HOME` for your machine.

To build the project locally:

```bash
./gradlew assembleDebug
```

To build a release APK:

```bash
./gradlew assembleRelease
```

Without configured release signing, `assembleRelease` produces `app-release-unsigned.apk` for verification. Configure the existing `SAMAPP_RELEASE_*` environment variables or ignored `keystore.properties` before creating an installable production release.

Existing WebView sign-ins cannot be migrated; sign in again once per account/website. Existing Gecko profiles persist across updates. Steam sign-in is separate from the marketplace profiles. Only the active browser session runs its extensions.

See [final manual verification](docs/manual-testing/geckoview-final-release.md) and the [architecture/upgrade contract](docs/adr/0001-adopt-geckoview-for-csfloat.md). Trade Token Sync awaits an official Firefox package in [issue #17](https://github.com/D4gkan/Steam-Account-Manager-App/issues/17).

## Project Structure

- app/ - Android application source
- app/src/main/java - Kotlin application code
- app/src/main/res - app resources and launcher assets
- app/src/test - JVM unit tests
- app/src/androidTest - Android instrumentation tests

## Security and Privacy Notes

- Local session isolation per account and website pair
- No plaintext password storage in the app
- Sensitive credential data is protected with Android security storage
- Browser data is kept separate to reduce account session leakage
- This project is intended for personal use and self-hosted Android distribution

## License

This project is licensed under the MIT License.

- License: [MIT](LICENSE)
- Copyright: 2026 Steam Account Manager contributors

## Disclaimer

This app is intended for managing Steam-related account sessions on Android. Use it in accordance with the applicable service terms and applicable local laws.

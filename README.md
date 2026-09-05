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
- Persistent browser session handling
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

The GitHub-ready APK is available in the releases folder:

- [releases/SAMApp-v1.0.0.apk](releases/SAMApp-v1.0.0.apk)

## Installation

1. Download the APK from the Releases page or the repository release folder.
2. Enable installation from unknown sources on your Android device if needed.
3. Install the APK and launch the app.

## Build Instructions

To build the project locally:

```bash
./gradlew assembleDebug
```

To build a release APK:

```bash
./gradlew assembleRelease
```

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

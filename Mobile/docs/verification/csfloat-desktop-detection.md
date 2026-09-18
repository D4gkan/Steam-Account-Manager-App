# CSFloat desktop detection regression — 2026-09-18

## Diagnosis

On the connected Samsung Galaxy S25 Ultra, app 1.1.0 debug had the official signed
CSFloat 5.17.0 installed and enabled. Its popup showed Offer Tracking Enabled.
The live CSFloat page exposed `CSFLOAT_EXTENSION_ENABLED=true` and
`CSFLOAT_EXTENSION_VERSION=5.17.0`.

CSFloat's public website code (`chunk-JNDQBU6G.js`) calls `cannotTradeOnDevice()`
before accepting a sale. That check rejects `isAndroidOnDesktopMode` even if the
extension meets the required version. In `chunk-TL3PFPUI.js`, that flag is computed
as touch input plus a user agent containing `linux x86_64`. The failure opens the
generic Setup Trade Verification dialog, making it look like a missing extension.

Read-only evaluation of the website's actual utility methods returned:

- Extension detected: true
- Mobile / iOS / Android user-agent checks: false
- Android desktop-mode check: true
- Device touch points: 5

This establishes a website device-detection incompatibility, not an outdated or
missing extension. It does not establish when the website introduced the check.

## Change

Only CSFloat website profiles and their website helper tabs use a Windows desktop
Firefox identity. Versions come from the running Gecko build. Touch input remains
enabled; official extension files, consent, permissions, account isolation, and
trading checks are unchanged. Other website profiles keep the default desktop UA.

## Validation

- `:app:testDebugUnitTest :app:assembleDebug` passed using JDK 21.
- Regression tests cover the observed device check, real engine-version retention,
  other-profile scope, and fallback for an unrecognized user agent.
- All 77 unit tests passed with zero failures/errors.
- Installed the updated debug APK over the existing app with data retained.
- On the same physical device and existing CSFloat profile, the live page reported
  Windows desktop Firefox 153.0, five touch points, and extension version 5.17.0.
- CSFloat's actual utility methods then returned extension detected = true and all
  four mobile/iOS/Android/Android-desktop checks = false (the last changed from true).
- A read-only `HAS_PERMISSIONS` request through the official page/content/background
  bridge returned `granted=true` for alarms and both Steam host origins.
- Existing CSFloat login remained available. No app data or extension was cleared.

Temporary Gecko debug configuration and the local port forward were removed after
inspection. No credentials, cookies, account identifiers, or trade contents are
included in this record. Device coverage was one existing CSFloat account profile;
the compatibility setting applies to every CSFloat profile.

No sale acceptance, trade creation, cancellation, or payment is used as a test.
This is a compatibility workaround for the current website device check, not a
claim of official CSFloat mobile-browser support or full end-to-end trading proof.

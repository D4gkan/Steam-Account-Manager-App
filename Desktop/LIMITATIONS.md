# Remaining release gates

This document records the pre-consolidation validation state. See the [root README](../README.md) for v1.1.0 build and test results, the browser startup correction, and the new optional uninstall data removal.

The Windows application is implemented and has a generated installer. It is **not yet a fully verified Windows-and-Linux release**. These are the specific remaining limits; they replace the earlier scaffold-only documentation.

## Live authentication and third-party extensions

- No user Steam credentials were supplied or used. The actual identity content script passes synthetic Steam own-profile versus other-profile fixtures in Chromium, but real authenticated Steam markup and Steam Guard onboarding must be tested manually.
- All eight supplied extensions have been observed enabled in the selected Windows Chromium runtime. This proves loading and exact identity/version, not authenticated behavior on each vendor website, VPN login, OAuth or trading-site integrations.
- BetterFloat 3.6.7 and Proton VPN 1.3.6 actually have manifest public keys in the current APP assets. The earlier documentation's statement that none had keys was incorrect. Their publisher IDs are preserved. The other six receive stable per-install keys and different IDs from the legacy listing IDs; external integrations tied to a store ID may need vendor support.
- Packages came from the supplied APP assets. Publisher signature authenticity, redistribution permissions and latest store versions have not been independently established. Attempted store-page retrieval in this continuation did not provide usable listing evidence. Do not treat the old version cross-check as a fresh check.
- The companion automatically dismisses BetterFloat and Proton VPN's exact onboarding pages. A tab can briefly appear before the companion closes it. Other extension pages are not blocked by this policy. The manager does not automate extension logins, VPN activation, trades, purchases or wagers.

## Linux

- Linux native-host executable generation succeeded, but that binary has not been executed on Linux.
- The Windows-hosted AppImage build failed with EPERM when creating an AppImage symlink. No Linux installer is delivered as working.
- Build on Linux using `packaging/linux-build.sh`. Ubuntu 24.04 LTS is the intended validation target, not a tested claim. Native messaging lookup, dependencies, X11/Wayland focus, browser survival, fresh installation and update behavior remain untested there.
- Linux's runtime download path uses the pinned Playwright build. OS-level browser dependencies may need installation by the Linux package manager. The application does not silently install privileged system packages.

## Distribution and lifecycle

- The Windows installer is unsigned (no signing certificate was provided).
- Included Chromium 153.0.8010.12, Playwright 1.63.0 and Electron 44.2.0 are pinned. Runtime updates are shipped through a new application build; there is no background vendor-extension auto-update service.
- Extension code is staged by digest and never overwritten in a running browser. Chromium-generated rule metadata is excluded from code hashes. Failed integrity checks require restoring the staged assets with browsers closed.
- Browser state is `unknown` when no authenticated connection or reliable observation is available. It is never presented as website login state.
- Uninstall preserves account data by default. To erase account sessions, close the account browser and delete the account in the manager before uninstalling. There is no separate uninstall-time bulk-profile deletion checkbox.
- Runtime downloads use the pinned official Playwright installer/HTTPS distribution. Independently signed upstream browser archive manifests and automatic compatibility certification are not implemented.

See `TEST-RESULTS.md` for executed checks. Installer creation is not itself proof of fresh installation, authenticated website behavior, or Linux support.

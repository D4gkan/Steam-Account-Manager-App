# GeckoView issue #5 emulator run

This is the non-sensitive machine-verification record for
[issue #5](https://github.com/D4gkan/Steam-Account-Manager-App/issues/5). It
does not use a Steam account, does not claim authenticated tracking, and does
not record an issue #7 `GO` decision.

## Run metadata

| Field | Value |
| --- | --- |
| App source commit and build variant | `4ba640317bc174926fb2e60f351ba21ef8344448`, `debug` |
| APK | `app/build/outputs/apk/debug/app-debug.apk`, 598,694,552 bytes, SHA-256 `BEE6E46394A0EED60F87CB0EF54DDC502DBB3F5F86C14592410D4FD59416F83C`; preserved on the campaign host at `C:\Users\esmer\AppData\Local\Temp\sam-gv5-issue5\app-debug-BEE6E463.apk` |
| GeckoView | `153.0.20260810162159`, stable Maven artifact |
| CSFloat | Official signed Firefox artifact, ID `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`, version `5.17.0`, GeckoView signed state `2` |
| CSFloat artifact | `https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi`, 7,011,169 bytes, SHA-256 `70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D` |
| Host | Windows 11 Pro 64-bit, version `10.0.26200`, build `26200`; Android Studio 2025.2.1 build `AI-252.25557.131.2521.14432022` |
| Android target | Dedicated AVD `Codex_GeckoView_Campaign_API_36`, serial `emulator-5580`, Android 16/API 36, `x86_64` |
| Emulator tooling | Android Emulator `36.2.12.0` build `14214601`; adb `36.0.0-13206524` |
| Test window | 2026-09-02 14:55:18–14:58:20 UTC |
| Gate result | Issue #5 machine scenarios pass. Authenticated tracking, alarms, physical-device behavior, and the issue #7 decision remain `NOT RUN`. |

## Commands and results

Commands ran from the repository root. `ANDROID_SERIAL=emulator-5580`
constrained Gradle instrumentation to the dedicated AVD, and every direct adb
command used `-s emulator-5580`.

```powershell
$env:ANDROID_HOME='C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL='emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug lintDebug connectedDebugAndroidTest --rerun-tasks
# exit 0: BUILD SUCCESSFUL; 23 unit tests, 9 instrumentation tests, debug assembly, and lint all passed

$adb='C:\Users\esmer\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb -s emulator-5580 install -r .\app\build\outputs\apk\debug\app-debug.apk
& $adb -s emulator-5580 shell pm clear com.steamaccountmanager.app.debug
& $adb -s emulator-5580 shell am start -W -n com.steamaccountmanager.app.debug/com.steamaccountmanager.app.prototype.GeckoViewPrototypeActivity
# all exit 0: exact APK installed, only the debug package was cleared, and the prototype cold-launched

& $adb -s emulator-5580 shell input tap 540 145
& $adb -s emulator-5580 shell input tap 875 1850
# both exit 0: requested the supported install flow and explicitly accepted its callback-derived consent prompt

& $adb -s emulator-5580 shell input tap 540 425
# exit 0: dispatched the resolved official action exactly once; GeckoView requested and loaded the official popup session

& $adb -s emulator-5580 shell input keyevent 4
& $adb -s emulator-5580 shell input tap 540 680
& $adb -s emulator-5580 shell input tap 540 800
# all exit 0: closed the popup, entered the clearly labeled test-only failure, then recovered through a fresh exact installed-extension query

& $adb -s emulator-5580 shell input tap 540 425
& $adb -s emulator-5580 shell input keyevent 4
& $adb -s emulator-5580 shell input tap 540 550
# all exit 0: opened the official popup again, closed it, and recorded its visible status

$appProcessId=(& $adb -s emulator-5580 shell pidof 'com.steamaccountmanager.app.debug:gecko_prototype').Trim()
& $adb -s emulator-5580 logcat -d --pid=$appProcessId -t 1000 '*:W' |
    Select-String 'nativeTab|AndroidRuntime|FATAL EXCEPTION|GV-ACTION-FAILED|GV-ACTION-CLICK-FAILED'
# exit 0, no matches
```

Generated reports:

- Unit tests: `app/build/reports/tests/testDebugUnitTest/index.html`
- Instrumentation: `app/build/reports/androidTests/connected/debug/index.html`
- Lint: `app/build/reports/lint-results-debug.html`

## Acceptance-to-proof result

| Contract | Result | Proof |
| --- | --- | --- |
| Official action/popup | PASS | The app delegates to GeckoView's resolved `WebExtension.Action.click()` and renders the Gecko-provided popup session. The [popup capture](evidence/issue-5/gv5-popup.png) visibly shows the official CSFloat `Offer Tracking Enabled` surface. No popup UI, DOM, or private message was reproduced by the app. |
| Consent gating | PASS | A clean debug-package run began with the action unavailable. Only after the issue #4 callback-derived consent prompt was accepted and GeckoView listed the exact enabled ID/version did the action become ready. |
| No optional runtime prompt | PASS | No optional-permission API is called. The Firefox artifact's install-time origins already include `*://*.steampowered.com/*`; the official popup therefore displayed its enabled state without an app-simulated prompt. |
| Honest shell states | PASS | `UNAVAILABLE`, `READY`, `ACTIVE`, and `FAILED` have fixed messages. The [ready capture](evidence/issue-5/gv5-ready.png) shows status recording disabled before a popup. The [active capture](evidence/issue-5/gv5-active.png) was taken only after a second visible official popup. Both states explicitly defer authenticated proof to #7. |
| Safe failure and recovery | PASS | The [failure capture](evidence/issue-5/gv5-failed.png) shows the clearly labeled deterministic failure and sole recovery action. The [recovered capture](evidence/issue-5/gv5-recovered.png) shows `READY` only after a fresh exact, enabled, same-identity engine query validated the cached action handle. |
| Duplicate and late callbacks | PASS | Unit tests use monotonic non-null request tokens and prove one in-flight dispatch, exact-once completion, null rejection, and no state change from stale or duplicate callbacks. The activity captures the pending token before `Action.click()` and ignores popup callbacks when no matching request is pending. |
| Redacted diagnostics | PASS | App diagnostics are fixed `GV-*` messages. The bounded PID-only action-error filter found no active-tab, crash, or action failure match. No raw exception, popup DOM, browser storage, account identity, or network body was captured. |
| GV-08 automation readiness | PASS | The complete popup/failure/recovery path was driven by exact-serial adb input and UI hierarchy inspection. Live authenticated tracking and alarm behavior remain `NOT RUN` for #7. |

## Reviewable evidence and privacy

Each PNG is an original 1080×2400 emulator capture. The captures were visually
inspected before commit and contain only the debug prototype, public Steam
content, and the official CSFloat popup. They contain no credentials, Steam
Guard codes, QR login material, cookies, tokens, account identifiers, private
inventory, trade details, payment information, or authentication UI. Popup UI
hierarchy output was deliberately not retained because it included a randomized
internal `moz-extension` URL that was unnecessary to prove the visible result.

- [Ready before popup](evidence/issue-5/gv5-ready.png): SHA-256 `97A67BC627DAD7E99E6A78EFDEE2201077B3DD924A98DC4B5EB740591AC3B294`
- [Official popup](evidence/issue-5/gv5-popup.png): SHA-256 `A931AB6B1553EBFA9E286DAAB162940F1319FB5B113F526E4398009C4E5D61F6`
- [Safe deterministic failure](evidence/issue-5/gv5-failed.png): SHA-256 `8A028855B6ED232484FFEE938C4EA34158A94FDB40EB2078906802F94EB187F9`
- [Recovered ready state](evidence/issue-5/gv5-recovered.png): SHA-256 `C61811BBEC7F76B50061946D28721FF5C0D0FBB42571ECCFA9649FDBDC7DD929`
- [Recorded visible status](evidence/issue-5/gv5-active.png): SHA-256 `B965BFC3EE8FE0210344A964982FD8F550EAFE261DBB68C06F3C7CE3A71C1F2A`

## Known limitations and non-claims

- This run used one x86_64 emulator and no Steam account.
- `Offer Tracking Enabled` proves the official popup surface and its current
  permission-derived status; it does not prove authenticated offer tracking,
  alarms, background delivery, or long-running reliability.
- The test-only failure seam proves the app state machine and recovery path, not
  every possible GeckoView or network failure.
- Two-session isolation, revoke/restore, process/lifecycle behavior, physical
  devices, and the compatibility `GO`/`NO-GO` remain assigned to issues #6–#7.
- This record is not an ADR amendment or permission to begin production migration.

# GeckoView issue #4 emulator run

This is the non-sensitive evidence record for the machine-verification portion of
[issue #4](https://github.com/D4gkan/Steam-Account-Manager-App/issues/4). It does
not record an issue #7 `GO` decision and does not replace the physical-device gate.

## Run metadata

| Field | Value |
| --- | --- |
| App source commit and build variant | `ff1389d96249161c788d763af8e93973bf71b524`, `debug` |
| Evidence-run app HEAD | `ff1389d96249161c788d763af8e93973bf71b524`; subsequent evidence-only commits do not change Android or Gradle inputs |
| APK | `app/build/outputs/apk/debug/app-debug.apk`, 598,678,168 bytes, SHA-256 `AF8F19CC4D0C64BB696C233165DB8401F8729227709EABB0D53A705A9D835876`; preserved on the campaign host for independent verification |
| GeckoView version/channel | `153.0.20260810162159`, stable Maven artifact |
| CSFloat source | `https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi` |
| CSFloat identity | ID `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`, version `5.17.0` |
| CSFloat artifact | 7,011,169 bytes, SHA-256 `70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D` |
| Observed signature state | GeckoView signed state `2`, reported after supported-API installation |
| Host | Windows 11 Pro 64-bit, version `10.0.26200`, build `26200` |
| Android Studio | 2025.2.1 build `AI-252.25557.131.2521.14432022` |
| Emulator tooling | Android Emulator `36.2.12.0` build `14214601`; adb `36.0.0-13206524` |
| Android target | Dedicated AVD `Codex_GeckoView_Campaign_API_36`, serial `emulator-5580`, Android 16/API 36, `x86_64`, medium-phone hardware profile |
| System image | `system-images/android-36/google_apis_playstore/x86_64`; fingerprint `google/sdk_gphone64_x86_64/emu64xa:16/BE2A.250530.026.D1/13818094:user/release-keys` |
| Test window and tester | 2026-09-02 13:24:56–13:31:18 UTC; Codex campaign orchestrator, with an independent `gpt-5.6-sol` medium tester |
| Runtime/profile/process topology | Debug-only launcher activity in `com.steamaccountmanager.app.debug:gecko_prototype`; one `GeckoRuntime`, one `GeckoSession`, default prototype profile; production WebView activity unchanged |
| Representative memory sample | Total PSS 250,773 KiB before extension installation and 244,771 KiB after installation and reload, a two-point delta of -6,002 KiB. This noisy emulator sample is recorded for reproduction and is not a performance claim. |
| Gate result | `INCOMPLETE` overall: issue #4 machine scenarios pass; GV-03 and the full issue #7 emulator/physical-device gate remain pending by design. |

## Commands and results

Commands ran from the repository root. `ANDROID_SERIAL=emulator-5580` constrained
Gradle instrumentation to the dedicated AVD. Every direct adb command used
`-s emulator-5580`.

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SERIAL='emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug lintDebug --rerun-tasks --stacktrace
# exit 0: BUILD SUCCESSFUL; 15 unit tests, 0 failures; debug APK assembled; lint passed

.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' connectedDebugAndroidTest --rerun-tasks --stacktrace
# exit 0: BUILD SUCCESSFUL; 9 instrumentation tests on Codex_GeckoView_Campaign_API_36, 0 failures

$adb="$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb -s emulator-5580 install -r -t .\app\build\outputs\apk\debug\app-debug.apk
# exit 0: Success

& $adb -s emulator-5580 shell am start -W -n 'com.steamaccountmanager.app.debug/com.steamaccountmanager.app.prototype.GeckoViewPrototypeActivity'
# exit 0: Status ok; LaunchState COLD

& $adb -s emulator-5580 shell cmd connectivity airplane-mode enable
& $adb -s emulator-5580 shell input tap 540 146
& $adb -s emulator-5580 shell cmd connectivity airplane-mode disable
# all exit 0: induced and safely recovered from an offline install failure; retry stayed enabled

& $adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug
& $adb -s emulator-5580 shell pm clear com.steamaccountmanager.app.debug
& $adb -s emulator-5580 shell am start -W -n 'com.steamaccountmanager.app.debug/com.steamaccountmanager.app.prototype.GeckoViewPrototypeActivity'
# all exit 0: reset only the debug package, then cold-launched a fresh online run

& $adb -s emulator-5580 shell input tap 540 146
# exit 0: requested the supported GeckoView extension-install flow

& $adb -s emulator-5580 shell input tap 690 1850
# exit 0: denied the first GeckoView install prompt; engine-state query reported expected ID absent

& $adb -s emulator-5580 shell input tap 540 180
& $adb -s emulator-5580 shell input tap 875 1850
# both exit 0: retried and explicitly accepted the second GeckoView install prompt

& $adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug
& $adb -s emulator-5580 shell am start -W -n 'com.steamaccountmanager.app.debug/com.steamaccountmanager.app.prototype.GeckoViewPrototypeActivity'
# both exit 0: cold process restart; prototype resumed without a crash
```

Generated reports:

- Unit tests: `app/build/reports/tests/testDebugUnitTest/index.html`
- Instrumentation: `app/build/reports/androidTests/connected/debug/index.html`
- Lint: `app/build/reports/lint-results-debug.html`

## Reviewable evidence

The evidence directory contains only the debug prototype, callback-derived consent
text, a public Steam market page, and bounded logs for the prototype PID. It was
visually inspected before commit. It contains no credentials, cookies, tokens,
account identifiers, private inventory, trade details, payment information, or
authentication UI.

- [Launch UI hierarchy](evidence/issue-4/gv4-launch.xml)
- [Install prompt screenshot](evidence/issue-4/gv4-prompt.png) and
  [UI hierarchy](evidence/issue-4/gv4-prompt.xml)
- [Denial screenshot](evidence/issue-4/gv4-denied.png) and
  [UI hierarchy](evidence/issue-4/gv4-denied.xml)
- [Installed-state screenshot](evidence/issue-4/gv4-installed.png) and
  [UI hierarchy](evidence/issue-4/gv4-installed.xml)
- [Visible injection screenshot](evidence/issue-4/gv4-injection.png)
- [Post-restart injection screenshot](evidence/issue-4/gv4-relaunch-injection.png)
- [Offline failure screenshot](evidence/issue-4/gv4-offline.png) and
  [UI hierarchy](evidence/issue-4/gv4-offline.xml)
- [Bounded warning-or-higher prototype-process log](evidence/issue-4/gv4-bounded-warning-log.txt)

## Consent evidence

The first install request presented an app-owned dialog titled `Install-time access
request`, identified `CSFloat Market Checker`, ID
`{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`, and version `5.17.0`, and rendered the
callback-derived origin list before any grant. The callback ID and version were checked
against the expected constants before the dialog could offer acceptance:

- `*://*.steamcommunity.com/market/listings/730/*`
- `*://*.steamcommunity.com/id/*/inventory*`
- `*://*.steamcommunity.com/id/*/tradehistory*`
- `*://*.steamcommunity.com/profiles/*/inventory*`
- `*://*.csfloat.com/*`
- `*://*.steampowered.com/*` (includes the Steam API host)
- `*://*.steamcommunity.com/profiles/*/tradehistory*`
- `*://*.steamcommunity.com/tradeoffer/*`
- `*://*.steamcommunity.com/*/tradeoffers/*`
- `*://*.steamcommunity.com/id/*`
- `*://*.steamcommunity.com/profiles/*`

GeckoView reported zero named permissions and zero data-collection entries for this
install callback. The prototype displayed those zero counts exactly instead of
inventing capabilities. It made no claim that the Firefox artifact exposes a runtime
optional Steam-host permission.

Denial returned to the still-usable public page, queried GeckoView's installed-extension
list, kept retry enabled, and showed `GV-INSTALL-DENIED-ABSENT: Consent denied; engine
reports expected CSFloat ID absent. Retry is available.` The next explicit attempt
presented the same access list and allowed acceptance. Success reported `CSFloat Market
Checker 5.17.0`, GeckoView signed state `2`, disabled the install button, and reloaded
the listing.

With airplane mode enabled, the same install action finished with
`GV-INSTALL-FAILED: Could not download or install CSFloat. Check the network and
retry.` It exposed a stable allow-listed stage code, did not include the underlying
exception or network state, and kept retry enabled. Airplane mode was then disabled.

## Scenario results

| ID | Result | Evidence |
| --- | --- | --- |
| GV-01 | PASS | The [launch hierarchy](evidence/issue-4/gv4-launch.xml) records the separate debug launcher; it cold-started in the `:gecko_prototype` process while production activity and WebView remained present and unchanged. |
| GV-02 | PASS | The [installed-state hierarchy](evidence/issue-4/gv4-installed.xml) and [screenshot](evidence/issue-4/gv4-installed.png) show that GeckoView's supported install API fetched, signature-validated, installed, and started the pinned official XPI. Identity, versions, source, checksum, and signed state were visible. |
| GV-03 | NOT RUN | Authenticated evidence is explicitly deferred to issue #7. No account was used in this run. |
| GV-04 | PASS | The [injection screenshot](evidence/issue-4/gv4-injection.png) shows CSFloat `Pattern Template`, `Wear Rating`, and wear-bar content on the public listing. The [post-restart screenshot](evidence/issue-4/gv4-relaunch-injection.png) shows the same injected content after a full app-process restart. |
| GV-05 | PASS | The [prompt hierarchy](evidence/issue-4/gv4-prompt.xml) and [screenshot](evidence/issue-4/gv4-prompt.png) show exact callback ID/version binding and all 11 origins, including `*://*.steampowered.com/*`, before consent. Unit tests reject wrong IDs and versions. |
| GV-06 | PASS | The [denial hierarchy](evidence/issue-4/gv4-denied.xml) and [screenshot](evidence/issue-4/gv4-denied.png) show GeckoView-observed expected-ID absence, a denial-specific safe explanation, enabled retry, and the still-loaded public listing. |
| GV-07 | PASS | The prompt and installed-state captures together show a later explicit acceptance and the exact signed Firefox artifact at signed state `2`; mismatched callback identity fails closed, post-install mismatch invokes uninstall, and no silent grant or optional-runtime-permission claim occurs. |

## Diagnostics and privacy

The [bounded warning-or-higher logcat read](evidence/issue-4/gv4-bounded-warning-log.txt)
used only the live prototype PID. It showed
expected emulator/Gecko initialization warnings (x86 CPU variant, HWUI format,
Android hidden-API denial, sandboxed sysfs/netlink denial, and unhandled browser-action
notifications). It contained no crash, app exception, credential, cookie, token,
account identifier, or trade data. The [offline failure capture](evidence/issue-4/gv4-offline.png)
independently records the safe failure code and recovery action. No full logcat or
browser storage was collected.

Screenshots and UI hierarchy captures were inspected before commit. They contain only
the debug prototype, its consent dialog, and a public Steam listing. Integrity hashes
for the committed screenshots are:

- Consent prompt PNG: `C2CDB5FDC17A535CDF8FD2CD29CC4C2AE1509F514998994DC03472AE11D384D4`
- Denial-state PNG: `1C7B5BFC652BAE749B78B8D6FEF55BB272D8458DB4AD9DC8A6AF7BF3EF3C8545`
- Installed-state PNG: `E0717B30DA477436796195C5D3226219507B19E1285D9CFFF4F93EC91961A7A9`
- Injection PNG: `C5C6D84C2173C049D3EBBDFB4D984075FBC954A82C2BF09A33FED859EE25E8BB`
- Post-restart injection PNG: `88159D46CBDA80F9369B078CD92E4575731521D0EFDA17A6DE1B67150DB0A046`
- Offline failure PNG: `F55DC3C1CD57F0AC95DD575AC7573465E12832DDA8A5230F49AA9FC2F3E209A6`

## Build-enabling scope

GeckoView 153 is the latest available stable release compatible with the installed
API 36 SDK; newer stable releases require API 37 and a newer Android toolchain. Its
metadata required compile SDK 36 and AGP 8.6–8.9.1 or later. Moving to AGP 8.11.2 and
Gradle 8.13 then required the matching Kotlin/Compose/KSP generation and Room 2.8.4.
No application target/minimum SDK changed. The two production-source changes are
limited to an API-level guard exposed by upgraded lint and a direct modifier expression
required to clear the same lint run; neither replaces or changes production browsing.

## Known limitations

- This run used a single x86_64 emulator and a public, unauthenticated page.
- Network content and listing values are nondeterministic; the observed run does not
  prove future Steam, AMO, or CSFloat availability.
- The memory figures are two settled point samples, not a benchmark.
- Authentication, two-session isolation, revoke/restore, tracking controls, lifecycle
  matrices, and physical-device behavior remain assigned to issues #5–#7.
- This record is not an ADR amendment, maintainer acknowledgement, or permission to
  begin production migration.

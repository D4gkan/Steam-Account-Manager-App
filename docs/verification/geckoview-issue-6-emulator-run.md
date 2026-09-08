# GeckoView issue #6 emulator run

This is the non-sensitive machine-verification record for
[issue #6](https://github.com/D4gkan/Steam-Account-Manager-App/issues/6). It
proves per-`(account, website)` Gecko profile isolation and lifecycle behavior
without using a Steam account. It does not claim authenticated tracking or an
issue #7 `GO` decision.

## Run metadata

| Field | Value |
| --- | --- |
| App source commit and build variant | `803acd1001455a3722c13991daabf4741201d706`, `debug` |
| APK | `app/build/outputs/apk/debug/app-debug.apk`, 598,793,996 bytes, SHA-256 `6E4E7CED8C7CE1039D39A7D7B394C56445A626C398708DC9A1DC6D368A5A1275`; preserved on the campaign host at `C:\Users\esmer\AppData\Local\Temp\sam-gv6-issue7-cycle7-final\app-debug-6E4E7CED.apk` |
| Upstream baseline APK | Commit `8de0e23443250326afbf087346b8c6a7eef302b7`, `debug`, 63,099,195 bytes, SHA-256 `352A9BDA1FDFA2E11942F7BC9C794FB00C1F27762A9C591274230CE6BBED8FD2` |
| GeckoView | `153.0.20260810162159`, stable Maven artifact |
| CSFloat | Official signed Firefox artifact, ID `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`, version `5.17.0`, GeckoView signed state `2` |
| CSFloat artifact | `https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi`, 7,011,169 bytes, SHA-256 `70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D` |
| Host | Windows 11 Pro 64-bit, version `10.0.26200`, build `26200`; Android Studio 2025.2.1 build `AI-252.25557.131.2521.14432022` |
| Android target | Dedicated AVD `Codex_GeckoView_Campaign_API_36`, serial `emulator-5580`, Android 16/API 36, `x86_64`, Google Play image |
| Emulator tooling | Android Emulator `36.2.12.0` build `14214601`; adb `36.0.0-13206524` |
| Final report timestamps | Unit tests 2026-09-03 13:58:30 UTC; lint 14:00:54 UTC; APK 14:04:43 UTC; final instrumentation 14:07:05 UTC; exact-APK emulator matrix completed 14:23 UTC |
| Gate result | Issue #6 machine scenarios pass. Authenticated Steam state, live CSFloat tracking, physical-device behavior, navigation policy, and the issue #7 decision remain `NOT RUN`. |

## Selected isolation topology

Each domain `SessionIdentifier(accountId, websiteId)` maps to a fixed-width opaque
`gv_` identifier. The identifier hashes the two length-prefixed UTF-8 fields so
neither account nor website text appears in the profile name and ambiguous
concatenations cannot collide. Each identifier owns a persistent directory below
the app's no-backup storage at `gecko-prototype-profiles`.

Only one reusable `:gecko_prototype` worker and one Gecko runtime are resident at
a time. The worker starts with Gecko's `--profile <absolute profile path>` argument.
Changing the selected pair stops the prior worker, waits a bounded eight seconds for
the worker and all app-owned colon subprocesses to exit, then starts the new profile.
A process-wide cleanup barrier lets a recreated router join the existing cleanup
without issuing another shutdown or starting a replacement inside the dying worker.
After three polls confirm that the old worker has departed, cleanup snapshots the
remaining old Gecko child identities once and never adopts a replacement process.
Only the latest selection is authorized after the captured set is gone. Timeout
clears the shared cleanup sentinel but fails the pending request closed. This avoids
keeping every possible browser session resident while preserving each profile on
disk.

Profiles remain below `noBackupFilesDir/gecko-prototype-profiles` while their browser
session exists. Cleanup may delete only the owning profile after that account/website
session is explicitly removed or revoked, after its worker has stopped, and after
contained-path validation. It must never bulk-clear other profiles. This prototype
demonstrates persistence but does not yet expose session-removal or cleanup UI.

Gecko `contextId` was rejected for this contract because extension installation,
storage, and enablement are runtime-wide. It cannot by itself isolate CSFloat state.
A persistent Gecko profile and a fresh runtime boundary are therefore required for
each selected pair.

The debug-only synthetic marker extension exercises extension storage and background
worker restart behavior. Version `1.5` upgrades retained fixture installs, retries a
native-message connection only after a real handshake, and rebinds an already-enabled
fixture after its delegate is registered. It never enables a fixture the user left
disabled. The marker is not present in release merged assets or manifests. The
production package remains the official, unmodified CSFloat artifact.

## Commands and results

Commands ran from the repository root. `ANDROID_SERIAL=emulator-5580` constrained
Gradle instrumentation to the dedicated AVD, and every direct adb command used
`-s emulator-5580`.

```powershell
$env:ANDROID_HOME='C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:ANDROID_SERIAL='emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug lintDebug connectedDebugAndroidTest processReleaseMainManifest mergeReleaseAssets --rerun-tasks
# exit 0: BUILD SUCCESSFUL in 2m41s; 40 unit tests, lint, debug build,
# release-exclusion inputs, and all 15 instrumentation tests passed

.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' connectedDebugAndroidTest --rerun-tasks
# exit 0: BUILD SUCCESSFUL in 2m45s; all 15 tests passed
# repeated once more without a source change: exit 0, BUILD SUCCESSFUL in 2m50s;
# all 15 tests passed. These are three consecutive complete green runs.

$adb='C:\Users\esmer\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb -s emulator-5580 install -r C:\Users\esmer\AppData\Local\Temp\sam-gv6-issue7-cycle7-final\app-debug-6E4E7CED.apk
& $adb -s emulator-5580 shell am start -W -n com.steamaccountmanager.app.debug/com.steamaccountmanager.app.prototype.GeckoPrototypeRouterActivity
# exit 0: the exact APK installed and the exported router cold-launched. Select
# Open synthetic slot A; the non-exported worker can be launched only with a slot.

& $adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug
& $adb -s emulator-5580 shell am start -W -n com.steamaccountmanager.app.debug/com.steamaccountmanager.app.prototype.GeckoPrototypeRouterActivity
# both exit 0: select Reopen selected slot in the router. The cycle-7 restart
# evidence records the selected B profile and its enabled CSFloat state restored.

& $adb -s emulator-5580 shell ps -A
# after Stop worker process reported GV-WORKER-STOPPED, filtering the output to
# com.steamaccountmanager.app.debug returned only the router process

& $adb -s emulator-5580 logcat -d -t 400 '*:E'
# exit 0 with no matching error records
```

Every direct adb command in the final cycle-7 acceptance run used `-s emulator-5580`.
UI actions were driven with `adb shell input`; every claimed state was checked with a
fresh `uiautomator dump`, and representative states have sanitized screenshots. The
exact-source run observed A and B independently absent, independently consented and
enabled, A disabled while B remained enabled, A re-enabled and uninstalled while B
remained enabled, consent denial remaining absent, complete worker shutdown, and B
restoring after activity recreation, screen close/reopen, worker recreation, and full
package restart. The accepted A install harness initially waited for an obsolete
internal status string; the diagnostic dump showed the actual visible `Installed and
ready` receipt and enabled state. This was a harness assertion error, not an install
failure; no product retry or second install was needed.

The retained-package repair proof also ran the strengthened router and marker tests
10 consecutive times each, plus the reverse marker-to-router order. A saved v1.4 APK
was then upgraded with `adb install -r` without clearing data; the v1.5 receipt and
lifecycle test passed. The final current-source suite ran three consecutive times with
15/15 results each. Bounded app-specific error logcat was empty. Earlier shell
preflight failures lacked the explicit SDK/JBR environment and never entered the test
graph; project configuration was not changed.

Generated reports:

- Unit tests: `app/build/reports/tests/testDebugUnitTest/index.html` — 40 tests,
  zero failures, errors, or skips.
- Instrumentation: `app/build/reports/androidTests/connected/debug/index.html` —
  15 tests, zero failures, errors, or skips in each of three consecutive final runs.
- Instrumentation XML:
  `app/build/outputs/androidTest-results/connected/debug/TEST-Codex_GeckoView_Campaign_API_36(AVD) - 16-_app-.xml`.
- Lint: `app/build/reports/lint-results-debug.html` — zero errors and 110 warnings.

## Acceptance-to-proof result

| Contract | Result | Proof |
| --- | --- | --- |
| Stable isolated profile identity | PASS | Unit tests feed the domain `SessionIdentifier` directly to the Gecko mapping and cover deterministic IDs, ambiguous input pairs, Unicode, distinct empty-value encodings, and fixed-width redacted output. On-device A/B/A switching restored the correct engine-observed marker for A. |
| Cookies, local storage, IndexedDB, and navigation | PASS | Instrumentation writes distinct engine-observed values for A and B, including `history.state`-derived `A-history`/`B-history` values independent of local storage, then switches A → B → A, recreates the activity, closes/reopens the screen, and restarts the worker. A separate exact-serial adb check force-stops/restarts the app. Values restore only in their owning profile. |
| Extension storage | PASS | Debug marker version `1.5` writes distinct native-message-observed values in each profile, upgrades a retained v1.4 fixture without clearing its profile, and reconnects only after a valid native handshake. It restores after repeated activity recreation, screen close/reopen, worker recreation, and full app restart; an explicitly disabled marker remains disabled. |
| Official CSFloat installed/enabled state | PASS | A and B independently began absent, independently displayed the exact install consent, and independently enabled the same signed ID/version. Disabling or uninstalling A did not change B. Explicit enable restored only A. Reinstalling A repeated consent; denial left A absent and a later accepted retry restored only A. Unit policy tests and live wiring also require revocation operations to target the same CSFloat ID across version drift while enable/action paths remain pinned to the exact approved version. A mismatched package was not staged in Gecko because creating or modifying one would violate the artifact rule. |
| Repeated switching | PASS | Instrumentation and the manual emulator matrix switch repeatedly without cross-profile marker exposure. Latest selection supersedes an older pending switch, explicit Stop supersedes a pending selection, Reopen supersedes a pending Stop, and destroyed routers cannot deliver stale authorization. An immediate reopen after router recreation remains responsive beyond the old cleanup window. The runtime/process design keeps one active profile resident rather than all stored profiles. |
| Activity and screen lifecycle | PASS | Activity recreation and browser screen close/reopen restored A's engine-observed page and extension markers without a duplicate install prompt. |
| Worker process recreation | PASS | Explicit stop reported `GV-WORKER-STOPPED` only after the worker and all app-owned colon subprocesses were absent. Reopening restored A from the same persistent profile. Recreating the router during a pending switch invalidated stale authorization, joined the already-started cleanup, and reopened A only after the dying worker was gone. |
| Full app restart | PASS | Force-stop left no package process. A cold router launch retained the selected pair, and reopening the worker restored A's engine and CSFloat state. |
| Failure and recovery | PASS | Worker shutdown has an eight-second bound and fails closed. Marker native-message reconnection is bounded to 30 attempts at two-second intervals. Install denial remains absent and retry is explicit. |
| Release exclusion | PASS | Release merged assets contain no issue #6 marker extension, and the release merged manifest contains no prototype marker or prototype process entry. Release packaging remains unverified because the local release signing store is unavailable. |

## A/B and lifecycle matrix

| Transition | A observed state | B observed state | Result |
| --- | --- | --- | --- |
| Clean A | A page/storage marker; CSFloat absent | Not active | PASS |
| Install and enable A | A markers; CSFloat enabled | Not active | PASS |
| A → B | Not resident | B marker; CSFloat absent | PASS |
| Install and enable B | Not resident | B markers; CSFloat enabled | PASS |
| B → A | A markers; CSFloat enabled | Not resident | PASS |
| Pending B → latest A reopen | A restores; no B marker appears | Not resident | PASS |
| Pending B → explicit Stop | Router retains A; no child process remains | Not resident | PASS |
| Pending Stop → A reopen | A restores after proven worker death | Not resident | PASS |
| Pending B → router recreation → immediate A reopen | A reopens after old cleanup and remains responsive; stale B is not authorized; later Stop removes all children | Not resident | PASS |
| Disable A, inspect B | A disabled | B remains enabled | PASS |
| Re-enable then uninstall A, inspect B | A absent | B remains enabled | PASS |
| Reinstall A | Consent denial leaves A absent; accepted retry restores A | B remains enabled | PASS |
| Activity recreation | A markers and CSFloat enabled restore | Not resident | PASS |
| Screen close/reopen | A markers and CSFloat enabled restore | Not resident | PASS |
| Worker stop/reopen | No worker/app-owned child, then A restores | Not resident | PASS |
| Full package restart | A selection, markers, and CSFloat state restore | Not resident | PASS |

## Representative process and size observations

These are point samples from `adb shell dumpsys meminfo`, not benchmarks or release
performance claims. Stored profiles did not cause the process count to grow.

| State | Processes | Total proportional set size |
| --- | ---: | ---: |
| B active after the current-head isolation matrix | 7 | 590,931 KiB |
| Router only after a current-head proven worker stop | 1 | 133,659 KiB |

The issue #6 debug APK is 535,694,801 bytes larger than the upstream-main debug
baseline. This is a fat debug artifact containing GeckoView native binaries; it is
not a release-download or installed-size claim.

## Reviewable evidence and privacy

Every PNG is an original 1080×2400 emulator capture. The first seven captures below
record the pre-cycle-4 baseline at `9095a4d`; the first `gv6-cycle4-*` group records
the intermediate cycle-4 source commit `9db111a`; and the `gv6-cycle4-final-*` group
records source commit `8384c77`. Those groups and the `gv6-cycle5-final-*` group at
`bbe36da` are historical. The `gv6-cycle6-*` group at `54139b4` is also historical.
Only the `gv6-cycle7-*` group at `803acd1` is current screenshot proof.
All retained PNGs were visually inspected, and the matching UI hierarchy XML was
reviewed for sensitive fields before commit. They contain only the debug
prototype, public fixture text, fixed `GV-*` status labels, and the official CSFloat
consent surface. They contain no credentials, Steam Guard codes, QR login material,
cookies, tokens, account identifiers, inventory, trade details, payment information,
or authentication UI.

- [A with official CSFloat enabled](evidence/issue-6/gv6-a-enabled.png): SHA-256
  `342699F7FFB37B0E8CC3F379B37A7952688037C6BFFC6B6A2B0295098B3BDD75`
- [B remains absent](evidence/issue-6/gv6-b-absent.png): SHA-256
  `9D591596DFDE4D1B7C6B49F4F849D6D68CFB7EFC7699F3121CB69A892DDCDD3E`
- [A repeats consent on reinstall](evidence/issue-6/gv6-reinstall-consent.png):
  SHA-256 `F59A5A2775CF3AF123981456BE6923D44A7AFC8EF4E1EAE4E6215D1EBF817F8B`
- [Worker fully stopped](evidence/issue-6/gv6-worker-stopped.png): SHA-256
  `1F90D0AD09AE1D011FEC2D45668EF3261784DC4FAB9BEFB880997620ABC8500C`
- [A restored after worker recreation](evidence/issue-6/gv6-worker-restored.png):
  SHA-256 `532475589CB79CB88AF76A641A2207E60C80E58EE7592BA8B97624991C5C3FE2`
- [A restored after full app restart](evidence/issue-6/gv6-app-restart-restored.png):
  SHA-256 `AA4CC68FA00B2594399773CDC94A557107B662CB666897F1F6357DFCBC0A0D5D`
- [A synthetic engine and extension markers](evidence/issue-6/gv6-a-synthetic-markers.png):
  SHA-256 `177498974B00356AEF676C7A7F7D890B4F8D2FF755637F25A99FCA422D43B9BD`
- [Cycle 4 A enabled after repeated consent](evidence/issue-6/gv6-cycle4-a-final-enabled.png):
  SHA-256 `72E65430D4DF12C38BEBAC7DCBDCED986C18AEBC8B18FD30BABE306499D69B1A`
- [Cycle 4 B remains enabled after A is disabled](evidence/issue-6/gv6-cycle4-b-after-a-disable.png):
  SHA-256 `536CAAA59F8408E0D1FE778122DF4B63CA231608C62A862A25BA8C951DA172C0`
- [Cycle 4 revoked CSFloat state](evidence/issue-6/gv6-cycle4-revoked-state.png):
  SHA-256 `7DD07A883EB0280FBD234994B5A92AD2A9E6B1AD1CD3D6D32D12B5EBEE20C35A`
- [Cycle 4 revoked action is unavailable](evidence/issue-6/gv6-cycle4-revoked-action.png):
  SHA-256 `8F6073FCF680EF82C3DCBA057A3D875E604E9ACE9FF79179434F1564FB2451EF`
- [Cycle 4 complete worker stop](evidence/issue-6/gv6-cycle4-worker-stopped.png):
  SHA-256 `C23BA1D3BB158D4207A682FFCC4526748F800AD8757EF95654295115D0702703`
- [Cycle 4 full restart restoration](evidence/issue-6/gv6-cycle4-full-restart-restored.png):
  SHA-256 `4976335A87DED855AA45A831BEDD5649137BD183FAC40298574E2124C7086429`
- [Cycle 4 repeated install consent](evidence/issue-6/gv6-cycle4-consent.png):
  SHA-256 `4DE383BCBADC3020A5E554C0F7913A6B9C5415993BCD0BA6745160A2B0B5091C`
- [Final cycle 4 install consent](evidence/issue-6/gv6-cycle4-final-consent.png):
  SHA-256 `E724153A2FF55810BF1968B88D2F90138811AE63369B7B52EA4090CD967CC7FE`
- [Final cycle 4 A enabled](evidence/issue-6/gv6-cycle4-final-a-enabled.png):
  SHA-256 `AA8CBDDD9108EF7D280551715D47623B88484F4428C7E7DBC6E822D527E3AC96`
- [Final cycle 4 B remains independently enabled](evidence/issue-6/gv6-cycle4-final-b-isolated.png):
  SHA-256 `A5EDCF8EE163042C5E5B31D792770AAD749F0C048087950E0DCD602977752444`
- [Final cycle 4 revoked CSFloat state](evidence/issue-6/gv6-cycle4-final-revoked-state.png):
  SHA-256 `EFEE11F733AE8A876C9EEA929A75645BD97E887863994EF3A468E0A1D950C9D0`
- [Final cycle 4 revoked action controls](evidence/issue-6/gv6-cycle4-final-revoked-action.png):
  SHA-256 `29DAD572A7ED89A141992E60700AAE16033D857FE7F7101616E46BA37CA7ABFC`
- [Final cycle 4 complete worker stop](evidence/issue-6/gv6-cycle4-final-worker-stopped.png):
  SHA-256 `0ACEABC574EB29EAB7CA27A8E417275229875E964D0AAF4E8C8F44960EB435C9`
- [Final cycle 4 full restart restoration](evidence/issue-6/gv6-cycle4-final-full-restart.png):
  SHA-256 `980AF88DDB5562B178B98BEF029D348A1F0643B3B7E2B4AC8998682C9B3C56B8`
- [Final cycle 5 exact consent](evidence/issue-6/gv6-cycle5-final-consent.png):
  SHA-256 `15308D33F00A17FBBABE07A37D846FB02F5623922D8BA28898D05A4367CFD9D3`
- [Final cycle 5 A enabled](evidence/issue-6/gv6-cycle5-final-a-enabled.png):
  SHA-256 `99DF3ADEAC9340BEC1165B90D386EB4DF6D92A852F9B262E05EF3136C4E50A15`
- [Final cycle 5 latest selection wins](evidence/issue-6/gv6-cycle5-final-latest-wins.png):
  SHA-256 `972D938B504A387C424C3933F68795927E735F7BFBA463BECCECD54C22846CFF`
- [Final cycle 5 Stop supersedes selection](evidence/issue-6/gv6-cycle5-final-stop-supersedes.png):
  SHA-256 `859145742881937A57BCAD1BD518C29359AC77BE19E6DBE504B603A8750DB78B`
- [Final cycle 5 router recreation cleanup](evidence/issue-6/gv6-cycle5-final-router-recreate.png):
  SHA-256 `EEB159412C763CFDE7900015CD70357A4DD702C754AF124F9E75BE7BDC874914`
- [Final cycle 5 B remains enabled after A uninstall](evidence/issue-6/gv6-cycle5-final-b-after-a-uninstall.png):
  SHA-256 `F8F08A2E650CFFD8DCBCD441C648E1B0F2BA0D10A1AFB8C87A4C4C65D2E5CBBC`
- [Final cycle 5 revoked action fails closed](evidence/issue-6/gv6-cycle5-final-a-revoked-action.png):
  SHA-256 `CFBD372497E7C1BC0FD69E14DBC5BEB1F0B8288455C70C3E7E4F4672392127E6`
- [Final cycle 5 denied install remains absent](evidence/issue-6/gv6-cycle5-final-a-denied.png):
  SHA-256 `D7D7331327C83F8823886582A00C6E7A23347F326BE6D3C13EAEB36D7E0B5925`
- [Final cycle 5 full restart restoration](evidence/issue-6/gv6-cycle5-final-full-restart.png):
  SHA-256 `92E0C16CA18A519F45E1A47EDD2CA567C440C36D19DDDCBA9E00049DF7C1CF95`
- [Cycle 6 exact consent](evidence/issue-6/gv6-cycle6-consent.png): SHA-256
  `F4ED0730439B9B80A7ADF018B33B16A430AF41A67BA397C5ECD95CB72D74F98B`
- [Cycle 6 A enabled with independent navigation marker](evidence/issue-6/gv6-cycle6-a-enabled.png):
  SHA-256 `77E75B4ABB8E1EDFB38020EA4EE2238B710E96E7B4E993D5206FA3253F292374`
- [Cycle 6 B remains enabled after A disable](evidence/issue-6/gv6-cycle6-b-after-a-disable.png):
  SHA-256 `76CA9467401F2DEAEEDDCF06BF7ACAE3448699A3E277B75CB99B2AB0864E42C8`
- [Cycle 6 A revoked](evidence/issue-6/gv6-cycle6-a-revoked.png): SHA-256
  `168FE51E70756998BCE245CCA004833C2CE8FDEB84DF21CFA91CC48578AC2A37`
- [Cycle 6 B remains enabled after A uninstall](evidence/issue-6/gv6-cycle6-b-after-a-uninstall.png):
  SHA-256 `CFC07400995D41F82D3B588FBE639828810C5123DE1AC59E1189AF2EC7A7DC1C`
- [Cycle 6 denied install remains absent](evidence/issue-6/gv6-cycle6-a-denied.png):
  SHA-256 `3D636FEE64DB613B0E280323EFF9BFBBDA19C3792B05F4A3730782832F46517B`
- [Cycle 6 full restart restoration](evidence/issue-6/gv6-cycle6-full-restart.png):
  SHA-256 `CFDBC8F784AEAFF7170668AC7BB3F6E321C48C3C2D651F3DED03A292B73FABF5`
- [Cycle 6 immediate reopen survives router cleanup](evidence/issue-6/gv6-cycle6-router-reopen.png):
  SHA-256 `DFB3A4D2D39B93D5D1F91E3B10B9F7142434B0C9C3F046F3A9D257C3981CCD76`
- [Cycle 6 complete worker stop](evidence/issue-6/gv6-cycle6-worker-stopped.png):
  SHA-256 `547747F678E827851EB44A4044FF3C8A0AC233DB4396C200852F1CF8AE646408`
- [Cycle 7 exact install consent](evidence/issue-6/gv6-cycle7-consent.png): SHA-256
  `24B7DF60C716A50C8D2CA05E2365302758293D785CEE90579738EE52E0C9E428`
- [Cycle 7 A enabled with independent History API marker](evidence/issue-6/gv6-cycle7-a-enabled.png):
  SHA-256 `30034E36D01665EED13D02A077C930394BE946EB855DC534D49E9EF88246A4A3`
- [Cycle 7 B enabled after full app restart](evidence/issue-6/gv6-cycle7-b-full-restart.png):
  SHA-256 `619FCA98CFE15FC5D7B3E2F3A92F0378E6EF5AC2FD9DB5DE8BC1D594447E5AF0`
- [Cycle 7 complete worker stop](evidence/issue-6/gv6-cycle7-worker-stopped.png):
  SHA-256 `F709190DC488A8D0E51E7676744A28D01E78682FC8A0FB8A2B2262169B22D0F3`

The current cycle-7 XML evidence in `evidence/issue-6/` records the exact consent,
A enabled state with the independent History API marker, B enabled state after a full
app restart, and bounded worker shutdown. The complete generated instrumentation
report records the router-cleanup, repeated reconnect, disable/uninstall isolation,
activity, screen, and worker-recreation paths.
It contains accessibility attributes such as
`password="false"`; those attributes are not captured credentials.

The debug marker's source checksums are
`041377A2898780D7F1CFC2E3E215D2C41B765F8315FD5D7AA0B60EED542652DF`
for `background.js` and
`7B67AA727AC77CF98C48098CB226577707908C4CA217E16037709C2238F5687B`
for `manifest.json`.

## Repair history

The original three-cycle repair budget was exhausted:

1. Explicit stop initially left a Gecko crash helper. Shutdown now waits for the
   worker and every app-owned colon subprocess before acknowledging completion.
2. Hosting the fixture in the persistent router process allowed Android to freeze the
   server while the worker was active. The loopback fixture moved into the worker.
3. Full-suite contention exposed a too-short native marker reconnection window. The
   bounded window increased to 30 two-second attempts and marker version `1.4`.

After the third repair, two consecutive writer runs and one orchestrator run passed
the complete 10-test instrumentation suite. The user then explicitly authorized
exceptional repair cycle 4, which corrected fail-closed CSFloat action/tracking state
after disable, uninstall, a non-enabled refresh, mutation failure, or extension-list
failure and expanded the process barrier to cover every app-owned Gecko child process
while preserving graceful worker shutdown.

The user then explicitly authorized exceptional repair cycle 5. A red real-router
test reproduced stale profile authorization when B was requested and A was reopened
before shutdown completed. One coordinator generation now owns profile selection,
explicit Stop, timeout, and process-death completion, so only the latest exact request
can authorize a worker. Tests then exposed and fixed B-to-Stop and Stop-to-Reopen
ordering. Final emulator review found that router recreation correctly invalidated
authorization but canceled cleanup, leaving a crash helper. The final red test and
fix retain authorization invalidation while allowing only the already-started bounded
subprocess cleanup to finish. Marker install failure paths also release their in-flight
guard so recovery remains possible.

The user then authorized repair cycle 6 and standing self-approval for future
evidence-based `EXHAUSTED` repairs. Cycle 6 bound the Gecko mapping directly to the
domain `SessionIdentifier`, replaced the duplicate local-storage navigation marker
with a History API marker, made same-ID version drift revocable without relaxing the
pinned enable/action identity, and added a process-wide cleanup barrier. A red
immediate-reopen scenario first reproduced `GV6|loading`; the repair prevents joiners
from rebroadcasting shutdown and authorizes the latest selection only after the old
process set is absent.

The independent tester then reproduced two order-dependent lifecycle failures. Under
the standing authorization, cycle 7 strengthened the real router and marker tests,
made cleanup own a single post-shutdown process snapshot, and made destroyed-router
success or timeout clear shared cleanup state exactly once. The debug marker now
requires a valid message handshake, upgrades retained v1.4 fixtures to v1.5, and
restarts only an already-enabled marker background after binding its delegate. Lint
then caught two Gecko calls outside the UI thread; `803acd1` marshalled that continuation
to the UI thread. Three consecutive 15-test final suites and the exact-APK CSFloat
matrix passed after the repair.

## Known limitations and non-claims

- This run used one x86_64 emulator and no Steam account.
- Synthetic markers prove browser-engine and extension-storage boundaries. They do
  not prove authenticated Steam identity, live CSFloat injection, offers, alarms,
  or background tracking.
- Same-ID unexpected-version revocation is covered by deterministic policy tests and
  the live controller wiring. No modified or lookalike CSFloat package was installed
  to manufacture that state; exact-device occurrence remains a recovery-path risk for
  the human gate and production update policy.
- Physical-device screen, activity, browser-process, and full-app recreation remain
  required by issue #7.
- Navigation allowlisting, blocked external handoff, and full browser controls are
  not implemented by the prototype. GV-15 must be tested honestly at the issue #7
  gate; a failure is a `NO-GO`, not a reason to weaken the contract.
- Representative memory values are noisy point samples. Release packaging and
  release installed size were not measured because the local signing store is absent.
- This record is not an ADR amendment and does not authorize issue #8. Production
  work remains blocked until issue #7 has an official acknowledged `GO`.

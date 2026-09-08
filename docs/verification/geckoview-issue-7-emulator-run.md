# Issue #7 emulator verification receipt

Status: **Compatibility gate GO; human emulator and physical-device PASS; medium tester and xhigh GO-basis reviews PASS at `062da23`; issue #7 closed; production #8 released after commit/public synchronization**

## Current human evidence and issue #7 GO (reported 2026-09-06)

The user and upstream maintainer Dagkan attest that the complete authenticated
two-account guide passed using the exact released debug candidate and hashes recorded
below. This is a sanitized human report: no new screenshots, logs, browser storage,
credentials, account names, or other identifying authentication evidence were
supplied or inferred.

- Physical device: Samsung Galaxy S25 Ultra, Android 16; gate run approximately
  2026-09-05 15:15 CEST.
- Dedicated emulator: `Codex_GeckoView_Campaign_API_36`, `emulator-5580`, Android
  16/API 36, x86_64. The complete authenticated two-account guide was also reported
  PASS; no more precise human-run timestamp was supplied.
- Accounts and live behavior: two safe Steam test accounts; real Steam
  authentication, official CSFloat injection, the official action, and a genuine
  observable tracking/status update all passed.
- Scenario result: GV-01 through GV-16 all PASS on both required targets.
- Lifecycle and isolation result: A/B activity recreation, screen close/reopen,
  worker stop/reopen, full app restart, and disable/uninstall plus restore all PASS.
- Reauthentication: neither login nor Steam Guard was required after initial
  authentication.
- Failure record: no failed step and no failure message were reported.

Live issue #7 contains the
[GO comment](https://github.com/D4gkan/Steam-Account-Manager-App/issues/7#issuecomment-5557925973)
and is closed. Maintainer permission to close was relayed with the report. A medium
tester and fresh xhigh reviewer independently passed exact checkpoint
`062da23946c2f306f5a981c356f67a1da219de8d`; the xhigh reviewer reported no blockers
and acknowledged the `GO` basis. ADR-0001 now records the evidence-backed decisions.
Production issue #8 is released after this finalization is committed and synchronized
to the public repository.

## Current verification candidate: 9e254b2 (2026-09-04)

Checkpoint: `9e254b2aa8715e3e3703b80e91302cd6db531e21`. The app source is
unchanged from `c8f3be7`; only instrumentation-thread handling and failure-only
diagnostics changed. Full primary verification passed 24/24 with retained data in
887.643s, UTC `08:23:49.353–08:38:45.036` including installation. There are 24 pass
statuses, zero failure statuses, and a complete `OK (24 tests)` summary.
Neither the APK hash nor the primary passes authorize phone testing without a current accepted
independent checkpoint in the PR receipt.

The previous full-run failure below remains recorded. Two temporary same-process
replays of external recovery → latest reopen → navigation passed in 74.966s and
76.529s. Android 36 source confirms that accessibility IPC can occupy the calling
thread while awaiting remote results. Three unnecessary `runOnMainSync` wrappers
were removed from tests, leaving the app main thread free for lifecycle work;
actions, assertions, and timeouts are unchanged. The same replay passed in 70.726s.
This timing difference does not establish the earlier failure's root cause.
The temporary aggregate test was removed. Failure-only metadata now includes root
presence/package/class and at most 20 Java main-thread stack frames; no browser
text, account data, or storage is added to diagnostics.

The exact build command is the same as `c8f3be7` below. Exit 0; 84 tasks executed
in 42s, UTC `08:22:47.164–08:23:30.608`. All 43 unit tests passed with zero
failures/errors/skips. Lint remains zero errors/112 warnings. Release manifest and
asset exclusions passed: no prototype/Gecko/Mozilla manifest entries, and only the
five existing ICO assets without synthetic fixtures.
Preserved directory: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-final-9e254b2`.

- `app-debug.apk`: 598,810,380 bytes; SHA-256
  `D6E639CF0F69915BB065FE2904B112C8A63AA9A426CDE7A5B8EDB9977E32DA89`.
- `app-debug-androidTest.apk`: 2,219,966 bytes; SHA-256
  `CCA605A594B099B171F1318EA73AAE0F7EBAAF3FFBD97C53290327B289CA06CF`.
- Lint XML and full-run `instrumentation-primary.log` are preserved alongside them.
- Primary log SHA-256:
  `87CDA6D9D94124C06AFE8BF58039561FC33422E8F56BAD432D4D8A6BBBD73292`.
- The four primary unit-result XML files are preserved under `unit-results` there.
- Build log: `C:\Users\esmer\AppData\Local\Temp\gv7-accessibility-final-build.log`.
- Diagnostic replay logs: `gv7-external-sequence-probe.log`,
  `gv7-external-sequence-stack.log`, and `gv7-accessibility-thread-probe.log` under
  `C:\Users\esmer\AppData\Local\Temp`.

A subsequent temporary lookup-before-scroll optimization probe passed the same
three-scenario replay in 67.866s, versus 70.726s, but showed no meaningful benefit
and risked accepting an old identical marker before recreation. It and its aggregate
test were discarded; the test file was restored exactly to committed `9e254b2` with
no history rewrite. Log: `C:\Users\esmer\AppData\Local\Temp\gv7-lookup-first-probe.log`.
This probe is not part of the acceptance candidate.

The exact documentation checkpoint and its independent tester/reviewer receipts
are recorded in [Draft PR #14](https://github.com/D4gkan/Steam-Account-Manager-App/pull/14).
The final documentation checkpoint rebuilt the identical APKs and passed independent
retained-data verification. The later human Steam/CSFloat evidence, physical-device
result, reviewer acknowledgements, and official decision are recorded in the current
`GO` section above.

Current environment was rechecked: Windows 11 Pro `10.0.26200`; Android Studio
2025.2.1 build `AI-252.25557.131.2521.14432022`; dedicated AVD
`Codex_GeckoView_Campaign_API_36`, exact serial `emulator-5580`, Android 16/API 36,
x86_64, boot-completed `1`. Every adb command used that serial; no personal AVD,
physical device, SDK installation, or virtualization/security setting was changed.
No new authenticated screenshots or browser-storage exports were collected.

Known limitations: the c8 full-run failure is not conclusively attributed to one
cause despite the later full pass. Synthetic recreation checks request recreation
and inspect restored fixed markers; they do not establish unique identity for every
individual recreation transaction. The inherited synthetic marker's Reinstall
control preserves an existing disabled state; explicit Enable is separate. None of
these synthetic checks replaces the official CSFloat/live-account/device contract.

## Previous verification candidate: c8f3be7 (2026-09-04)

Source: `c8f3be7b756a37c7b2ca6dca326e46a56ab4326b`. Build and focused checks
pass; full primary validation failed, so independent acceptance is withheld. This is not
official issue #7 `GO`. No credentials or live accounts have been used, and no
physical-device results have been supplied. Live GitHub issue #7 remains open with
no decision or acknowledgements as of this candidate's build.

GV-16 recovery is now always available through an explicit **Open public Steam
listing in external browser** button. It uses only the fixed public listing, never
the embedded login/current URL or browser storage. The external browser has its own
session state. Missing-handler and security failures remain recoverable and redacted.
The existing blocked-destination choice is separate. Neither action proves CSFloat
tracking in the external browser.

Regression `86933c6` first failed because the button was absent (17.065s). Test
extension `c362f4b` verifies that no browser opens before the explicit tap, and that
the resolved browser opens afterward, including after a simulated missing-handler
error. A literal-quote mistake in the test's command was corrected before this
commit; the focused run passed in 9.782s. A filtered Android activity query confirmed
only the known public listing was handed to Chrome. Full dumpsys/browser contents
were not captured. Reviewer follow-up on `c8f3be7` found no blocking source findings;
final exact-checkpoint evidence review is still required.

### Exact build and artifacts

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
./gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug processReleaseMainManifest mergeReleaseAssets --rerun-tasks
```

Exit 0; 84 tasks executed in 51s, UTC `08:05:57.120–08:06:49.195`.
43 unit tests passed, zero failures/errors/skips. Lint: zero errors, 112 warnings
(the one additional warning suggests Kotlin's URI convenience extension).
Release manifest search found no prototype/Gecko/Mozilla entries; release assets
contain only the five existing site ICO files, with no synthetic fixture.
Build log: `C:\Users\esmer\AppData\Local\Temp\gv7-final-c8f3be7-build.log`.
Unit XML: `app/build/test-results/testDebugUnitTest/TEST-*.xml`.

Preserved directory: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-final-c8f3be7`.

- `app-debug.apk`: 598,810,380 bytes; SHA-256
  `D6E639CF0F69915BB065FE2904B112C8A63AA9A426CDE7A5B8EDB9977E32DA89`.
- `app-debug-androidTest.apk`: 2,220,310 bytes; SHA-256
  `482C8AF7AEE533577E3FCA72FA13FBE9461DCAE142BD739E087E594ED4E6FFFB`.
- Lint XML and `instrumentation-primary.log` are preserved alongside the APKs.

Direct installation uses `adb -s emulator-5580 install -r` for each exact APK.
The full run uses the command below; data is retained, not cleared or uninstalled:

```powershell
& 'C:\Users\esmer\AppData\Local\Android\Sdk\platform-tools\adb.exe' -s emulator-5580 shell am instrument -w -r com.steamaccountmanager.app.debug.test/androidx.test.runner.AndroidJUnitRunner
```

Instrumentation shell exit status alone is not proof: acceptance requires the
runner's complete `OK (24 tests)` summary with no failure status.

### Primary full-run failure

The retained-data full run began at UTC `08:07:16.408` (including installation).
The external-recovery test and the following latest-reopen routing test passed.
Navigation and uninstall tests then failed at their initial router-control lookup,
before their behavioral assertions. App-filtered Android lifecycle warnings showed
pause/destroy timeouts. This does not yet identify an app lifecycle bug versus
test/task/accessibility interference. The primary stopped the failed run explicitly
at UTC `08:13:49.003` by force-stopping only the owned debug app, without clearing
data; the resulting `Process crashed` runner ending was this deliberate stop, not
an independently observed native crash. There were 16 passes, two failures, and no
complete-suite `OK`. Primary log SHA-256:
`72EEEF004B438C5A27F2C522DC8E529B6936DF3E2EE934609128FBAA066490A2`.
This candidate is not a phone-test release. A bounded three-scenario replay is the
next diagnostic; no failure is attributed to missing credentials.

## Previous candidate: 5f915db (2026-09-04)

Source: `5f915db93ef165ec734d5b758e44b18edc4b5576`. This is not an approved build.
Primary full direct instrumentation passed 23/23 in 338.331s with retained data
(UTC `07:48:20.077–07:54:05.766`, including installation). The fresh reviewer then
identified missing always-available GV-16 external recovery. New regression commit
`86933c6` failed on the missing public-recovery button in 17.065s. That repair
invalidates this candidate's downstream acceptance. No live authentication or
physical-device proof exists. Samsung model
and Android version remain awaiting confirmation. Explicit device-test release must
be checked against the latest PR receipt; official acknowledged issue #7 `GO` still
requires full live emulator and physical-device proof before production #8.

Primary build passed 43 unit tests in approximately 36 seconds (UTC
`07:46:48.766–07:47:26.226`). Lint XML node counts: zero errors, **111 warnings**;
the earlier 123-warning count belongs to older builds. Release output contains five
ICO assets and no prototype assets/manifest entries. Build log:
`C:\Users\esmer\AppData\Local\Temp\gv7-final-5f915db-build.log`.

Preserved directory: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-final-5f915db`.

- `app-debug.apk`: 598,810,380 bytes; SHA-256
  `FD5A622D1E7B1427AB57FBA8C5A6280446CCA9E4ACA56DE203943B15B7D24447`.
- Test APK: 2,216,458 bytes; SHA-256
  `A4F234E80E31C608C5E232D7D7DAB27BDF14438E9648CDD175B014BCA150A271`.

### Bounded repair evidence

- `4980cca` makes native shutdown completion govern process exit. Pinned native
  code uses a 1500ms deferred startup-inventory save plus a final shutdown blocker;
  the former 500ms hard kill could precede persistence. USER-disabled flag 2 was
  observed. Pinned source can produce that flag when reconstructing stale startup
  inventory; this is consistent with the shutdown timing, not direct proof of the
  on-disk state. No browser storage was exported. The temporary explicit USER-enable
  probe was removed; APP semantics
  remain, with no automatic clearing of genuine USER revocation.
- `dc301da` rapid-close regression was red at final line 209 (DISABLED/WAIT).
  The two-test run took 73.674s; its uninstall counterpart passed.
- Runtime-owned barrier `29db0d4` passed three boundary tests in 95.535s, balancing
  restart operations across Activity loss and draining pending work before shutdown.
- Already-enabled no-op operations then reproduced a missing fresh marker result
  in 40.004s. `5f915db` uses one in-gate APP restart for already-enabled operations
  and reads each fresh port only after verified completion; focused proof passed
  in 11.263s. The full primary run subsequently passed as recorded above; neither
  result substitutes for independent validation of the newer GV-16 repair.

The rejected `17026da` results and earlier failures below remain historical evidence.

## Historical rejected resume (2026-09-04): source 17026da

Candidate source: `17026da06b8b0da99f47076742063d16de0389db` is rejected by repeated
independent validation. The earlier primary machine pass below is not approval of
this candidate or its APK hash. Repair and diagnostic investigation are in progress.
The primary machine pass was credential-free preparation only: no new screenshots,
live authentication, or physical-device proof were collected. Do not release phone
testing yet. Full live proof on both emulator and physical device, followed by the
official maintainer/reviewer-acknowledged issue #7 `GO`, remains required before #8.

### Independent repeat failure

Independent build checks passed 43 unit tests and lint with zero errors/123 warnings.
The first direct instrumentation run passed 19/19 in 194.023s; the repeat passed only
14/19 (five failures) in 284.987s, using the same installed packages and retained
data. Its app APK matched the primary SHA-256 `21EC924CF5AD42C6938B11B99783E329F2DD1095B2BB8346B12A52EA85198AE2`.
The first failure observed ABSENT after uninstall but DISABLED 1.5 after worker
restart; four later failures could not enable the marker. The native crash fix is
therefore not a whole-suite acceptance pass.

Evidence directory: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-independent-17026da`;
`independent-receipt.txt` and both direct-run logs are preserved there. Reviewer P2:
Activity ownership can drop the balancing enable after an interrupted restart's
disable completes. This finding does not yet prove the persistence failure's root
cause. No phone-test release or official `GO` is authorized.

### Reproduction and bounded native-crash fix

On baseline source `1dc8802` / documentation checkpoint `460a14c`, the two split
tests passed individually in 10.597s and 9.670s; the original combined test passed
alone in 24.127s. In the grouped nine-test run, 8/9 passed and one failed in 108.279s, with a native
port teardown crash during screen reopen (PID 11597, local timestamp
`2026-09-04 08:51:50.659`). App-scoped evidence:
`C:\Users\esmer\AppData\Local\Temp\gv7-baseline-worker-crash.log`.

Independent inspection of the pinned GeckoView Port implementation identified a
native shutdown race. Fix `17026da` replaces only two app-initiated marker-port
disconnect calls with a single inert, Activity-free delegate, leaving native closure
to the extension. Official CSFloat, the synthetic fixture, and the 500ms shutdown
behavior are unchanged. Tests were added in `514f7cc` / `774bd63`; an invalid
accessibility-window-ID assumption was corrected before the candidate run and was
not an application regression. Candidate checks passed 43 unit tests and all 10
profile tests (132.495s).

### Exact primary build and validation

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
./gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug lintDebug connectedDebugAndroidTest processReleaseMainManifest mergeReleaseAssets --rerun-tasks
```

Exact `17026da` result: exit 0 in 3m17s; 43 unit tests and 19 instrumentation tests
passed, zero skipped. Lint: zero errors, 123 warnings. Release manifest/assets checks
exclude the prototype. This is the primary run, not independent approval.

Preserved directory: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-port-17026da`.

- `app-debug.apk`: 598,810,380 bytes; SHA-256
  `21EC924CF5AD42C6938B11B99783E329F2DD1095B2BB8346B12A52EA85198AE2`.
- `instrumentation-primary.xml`: timestamp `2026-09-04T07:05:46`; SHA-256
  `6FA6C9ED058466EF8D80A9754B1CAD7AE138263F7A2C8E8132002BA6F6DA9C4E`.
- `lint-results-debug.xml` is preserved alongside those artifacts.

Environment: Windows 11 Pro build 26200; Android Studio 2025.2.1,
`AI-252.25557.131.2521.14432022`; dedicated AVD
`Codex_GeckoView_Campaign_API_36`, serial `emulator-5580`, Android 16/API 36,
x86_64. It was booted without wiping and retained profiles. The intended user's
Samsung model and Android version are awaiting confirmation. Credentials must be
entered only on the test device, never sent to agents.

## Historical failed resume (2026-09-03)

Historical source checkpoint: `1dc8802bc91e3f232580c607b5b114d36f12113e`.
The primary's first full instrumentation run passed 16/16; its repeat passed only
14/16, with initial engine-load and synthetic extension-marker failures. A single
passing run is not current acceptance evidence. Issue #7 has no `GO`; production
issue #8 and subsequent migration work remain blocked.

### Exact primary validation receipt for 1dc8802

Both commands used these environment settings:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
./gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug lintDebug connectedDebugAndroidTest processReleaseMainManifest mergeReleaseAssets --rerun-tasks
./gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' connectedDebugAndroidTest --rerun
```

- First command: exit 0; 43 unit tests and 16 instrumentation tests passed;
  lint reported 0 errors and 123 warnings. Preserved run-1 XML timestamp:
  `2026-09-03T19:15:21`.
- Repeat command: exit 1; 14/16 instrumentation tests passed. Preserved run-2
  XML timestamp: `2026-09-03T19:21:04`.
- Preserved directory: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-final-1dc8802`
  contains the run-1 XML, `instrumentation-run-2.xml`, and `app-debug.apk`.
- Run-2 XML SHA-256:
  `EFCBB627D4EBAE2ABC19474F10971E0769FE972F3E4FE1EF4E7AC70101918FEB`.
- Preserved `app-debug.apk` SHA-256:
  `60858B5691882E042DDB23EBC754F6CCD10356DD3D070E1B88AE8D609925E769`.

These artifacts describe that checkpoint, not a newly accepted final build. No
current-head medium/xhigh review pass has been accepted, and no `GO` is recorded.

Narrowed diagnostics on that source reproduced a later reinstall stall: installation
reported enabled 1.5, but the synthetic background had no `script-enter` phase and
the marker remained waiting. Earlier worker restarts did enter the background and
return results. This narrows the symptom, but does not establish a safe permanent
fix. Temporary diagnostic probes and console logging were removed.

A subsequent uncommitted experiment restarted the background after install, removed
the redundant post-enable install, and strengthened the enabled-state test wait.
Its instrumented narrow run passed once, but diagnostics-free validation failed in
116.596 seconds: after A's uninstall and an A→B→A switch, A was enabled when absence
was required (test line 245 in the experimental source). The experiment was rejected
and its three changes removed; source is restored to the checkpoint above. This is
not a passing current-head receipt or permission to proceed with device testing.

Safe local diagnostic artifacts (not committed full logs):

- Original narrowed result: `C:\Users\esmer\AppData\Local\Temp\gv7-marker-js-diag-result.log`
- Fixed-phase background evidence: `C:\Users\esmer\AppData\Local\Temp\gv7-marker-js-diag-phases.log`
- Instrumented experiment: `C:\Users\esmer\AppData\Local\Temp\gv7-marker-install-only-probe-result.log`
- Failed diagnostics-free experiment: `C:\Users\esmer\AppData\Local\Temp\gv7-marker-clean-candidate-result.log`

All runs used dedicated `emulator-5580`; no physical-device proof was collected.
The historical receipt below describes `b81eeab` only. Its APK, test counts, and
screenshots are historical evidence, not current authorization to run that APK.

## Historical b81eeab receipt — partial emulator pass only

This receipt records the autonomous emulator portion of the issue #7 compatibility
gate. It does not record an official `GO`. Steam authentication, authenticated CSFloat
injection/tracking, the two-live-account matrix, and the supported physical-device run
still require human testing before production issue #8 may begin.

## Exact build

- Source commit: `b81eeab10ee0554850f51ff9702052ce96ddba19`
- Starting campaign checkpoint: `099926bb5da2f2ef292e14757a8a54a7c9029bd7`
- Variant: debug
- Built APK: `app/build/outputs/apk/debug/app-debug.apk`
- Preserved APK: `C:\Users\esmer\AppData\Local\Temp\sam-gv7-navigation-repair-b81eeab\app-debug-4A5FF6D7.apk`
- Size: 598,810,380 bytes
- SHA-256: `4A5FF6D78B1B9FF75343B2D0681FF473F29A935C811FE3B5DC63F1EE99610755`
- GeckoView: `153.0.20260810162159`
- CSFloat: official signed Firefox artifact 5.17.0, ID
  `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`
- XPI SHA-256: `70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D`

## Environment

- Host: Windows 11 build 26200
- Android Studio: 2025.2.1, build AI-252.25557.131.2521.14432022
- Dedicated AVD: `Codex_GeckoView_Campaign_API_36`
- Exact adb serial: `emulator-5580`
- Android: 16 / API 36
- ABI: x86_64
- Image: Google Play
- Test window: 2026-09-03 17:34–17:45 UTC

The AVD was started without wiping it. The debug app alone was cleared for the clean
launch. Every device command used `adb -s emulator-5580`; the personal
`Medium_Phone_API_36.0` AVD and all physical devices were untouched.

## Automated checks

The exact source commit passed this single command with exit code 0:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug lintDebug connectedDebugAndroidTest processReleaseMainManifest mergeReleaseAssets --rerun-tasks
```

Results:

- 42/42 unit tests passed.
- 16/16 instrumentation tests passed on the dedicated AVD.
- `assembleDebug` passed.
- `lintDebug` passed with 0 errors and 113 warnings.
- Release merged-manifest search found no prototype activity or worker.
- Release merged-assets search found no synthetic marker/prototype asset.
- `git diff --check` passed.

Instrumentation result:
`app/build/outputs/androidTest-results/connected/debug/TEST-Codex_GeckoView_Campaign_API_36(AVD) - 16-_app-.xml`.

## Credential-free emulator scenarios

- Clean router launch displayed `GV-ROUTER-READY`, A/B selectors, reopen, router
  recreation, and worker-stop controls. This is emulator proof for GV-01.
- Slot A displayed the fixed cookie/local-storage/IndexedDB/history marker
  `GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history`.
- The synthetic extension returned
  `GV-MARKER-RESULT slot=A prior=A current=A` after its explicit fixture install.
- The complete instrumentation class exercised A/B isolation, revocation/restoration,
  activity recreation, screen reopen, worker stop/reopen, router recreation, and the
  retained marker upgrade path without a failure.
- The navigation policy allowed the exact loopback fixture and configured HTTPS Steam
  and Steam-auth hosts. Unit tests at this captured build rejected deceptive suffixes,
  unrelated hosts, insecure remote HTTP, and non-web destinations; later regression
  coverage adds user-info and malformed inputs without retroactively expanding this run.
- The deterministic unrelated destination stayed out of GeckoView. The app remained
  foreground, retained the A page marker, displayed the fixed redacted
  `GV-NAVIGATION-BLOCKED` message, and offered **Stay here** and
  **Open in external browser**. No external browser opened automatically.
- Back, Forward, and Reload controls were present and their GeckoSession calls compiled;
  live allowed-page history behavior remains in the human matrix.

Representative active-state memory after the blocked-navigation scenario comprised
seven app-owned processes with summed PSS of 410,523 KiB. This point-in-time emulator
measurement is not a release, battery, or physical-device performance claim.

## Reviewable evidence

- `evidence/issue-7/gv7-emulator-router-ready.png` — SHA-256
  `930AD08E2FB9190D47AB042F100EEEE231E20E0A27E8A06AED56376637D1D585`
- `evidence/issue-7/gv7-emulator-router-ready.xml` — SHA-256
  `0EE5BEF0EAA365BA799A62CC71FD5F7B52C1B826C39CFC756229FCDBBDB3E9CB`
- `evidence/issue-7/gv7-emulator-navigation-blocked.png` — SHA-256
  `D7B484F7F052D03DB71A2B6CD0E7150B1F61329360B7015292584FDC747CEDB0`
- `evidence/issue-7/gv7-emulator-navigation-blocked.xml` — SHA-256
  `2D88B0C5FBE392D727E9974439777243EEE71576CD7929EA4B6AFC150CA0BFAF`

The dedicated AVD's status-bar icons and clock were disabled during capture and the
policy was restored immediately afterward, so both screenshots exclude the status
bar. Both screenshots were visually inspected. Both XML dumps contain zero password nodes.
The only cookie-like text is the fixed synthetic `cookie=A` marker. No Steam account,
authentication, trade, payment, cookie/token, QR, or Steam Guard content was captured.

## Human proof still required

The current debug prototype is single-window: approved new-window links are routed
into the existing selected GeckoSession with the navigation policy checked again.
This machine preparation does not prove authentication flows that depend on
`window.opener`, `postMessage`, or `window.close`; those semantics remain human-gate work.

The following were deliberately **NOT RUN at historical b81eeab** and cannot be
inferred from that checkpoint. Newer fixed-public-listing external-handoff proof is
recorded above; it does not establish live authentication redirects:

- Steam authentication or Steam Guard on the emulator;
- authenticated CSFloat injection and official tracking/alarm behavior;
- two live Steam-account identities and their revoke/restore/restart matrix;
- allowed live authentication redirects and actual explicit external-browser handoff
  at that historical checkpoint;
- the complete GV-01–GV-16 run on a supported Android 9/API 28+ physical device;
- physical-device screen, activity, browser-process, and full-app recreation;
- reviewer acknowledgement, maintainer acknowledgement, ADR update, or official issue
  #7 `GO`.

Do not share passwords, Steam Guard codes, QR login screens, cookies, tokens, account
names, trades, payment information, or unredacted authentication screenshots.

Production issues #8–#12 remain blocked until the remaining human evidence passes,
the independent tester and reviewer accept the complete record, ADR-0001 records only
proven decisions, and issue #7 receives its official acknowledged `GO`.

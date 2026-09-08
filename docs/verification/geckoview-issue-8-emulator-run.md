# Issue #8 production GeckoView verification receipt

Status: **Machine/emulator verification and focused physical-device Steam smoke test PASS for application/test source `f203175`**

## Exact candidate

- Application/test source commit: `f203175c45c14ec764d0f43c4550dbbe137c95ec`
- Branch: `codex/geckoview-campaign`
- Variant: debug, using the production Steam-to-GeckoView routing path
- GeckoView: `153.0.20260810162159`
- Preserved evidence directory:
  `C:\Users\esmer\AppData\Local\Temp\sam-gv8-f203175`
- `app-debug.apk`: 598,942,841 bytes; SHA-256
  `8432D12371C43153E62F64134AC5160E409ACCFD798B243DC847AB862618C912`
- `app-debug-androidTest.apk`: 2,278,058 bytes; SHA-256
  `86D36B0BEFAFE64E0A3C44BF577A3AF83ECA0297B4F82A5EDABF0E880CAA1824`
- Preserved full instrumentation XML: 4,903 bytes; SHA-256
  `53ECB330F3F665BF3A6322C09EF72B2EBBD229D4218FE2724701DF436EA58E6F`

The APK is tied to the application/test source commit above. A following
documentation-only checkpoint does not change the APK or its source. The phone gate
must use this exact APK; the issue #7 prototype APK is not interchangeable.

## Physical-device result

The exact APK checksum above was confirmed before a successful approximately
15-minute run on a Samsung Galaxy S25 Ultra running Android 16. A/B isolation,
close/reopen persistence, full-phone-restart persistence, and public avatar/profile
detection all passed. No unexpected reauthentication occurred. The supplied result
contained no account names, credentials, authentication material, browser storage,
trades, payment data, or screenshots. Independent medium-tester and fresh xhigh
reviewer checks accepted the report as complete, consistent, and non-sensitive.

## What changed

Selecting Steam for an account now opens the production browser worker with a
persistent GeckoView profile derived from the exact `(account, website)` pair.
Different sessions are serialized through one worker and separate opaque profiles.
The old WebView implementation remains available for non-Steam sites and rollback;
this issue does not claim the final WebView removal.

Steam avatar/profile detection parses engine-neutral public page metadata through a
tightly scoped app-owned Gecko content-script bridge. Its built-in manifest grants
content-script native messaging only on the two approved Steam origins, and the app
registers the receiver on the exact originating Gecko session. Before the Gecko
runtime is created, a stored
bridge is activated, a new bridge is installed, or a Steam page is loaded, a
versioned per-profile dialog discloses the exact Steam origins, visible public
avatar/profile links, and the private connection back to the app. **Allow and
continue** must synchronously record consent before Gecko activation. If the durable
write fails, the app restores the in-process value to false, the disclosure remains
open with retry/cancel guidance, and no Gecko runtime, bridge, or page starts. If the
cache rollback itself fails, the app logs only a fixed diagnostic and terminates its
isolated browser process so a later attempt must reload durable state. Cancel or
Android Back closes the screen, loads nothing, starts no Gecko child process, and
stores no consent. A bridge retained from an earlier valid consent remains inert
until renewed consent is recorded. The async broadcast-to-Room update holds Android's
receiver lifecycle until completion. Existing account/session database fields and
schema are unchanged.

The production browser worker attempts graceful Gecko shutdown for three seconds and
the disposable prototype for six seconds, each within an eight-second total stop
budget. If Gecko does not exit, only the freshly revalidated exact captured worker
PID and process name may be terminated; allowlisted pinned-Gecko child processes are
then reaped and the empty process state must remain stable. The prototype's six-second
window lets a completed extension-state mutation flush before fallback termination.
This shared lifecycle repair was required by the full regression suite and does not
broaden the production migration scope.

## Environment

- Host: Windows 11 Pro `10.0.26200`, build 26200
- Android Studio: 2025.2.1, `AI-252.25557.131.2521.14432022`
- Dedicated AVD: `Codex_GeckoView_Campaign_API_36`
- Exact adb serial: `emulator-5580`
- Android: 16 / API 36
- ABI: x86_64
- Verification date: 2026-09-06

Every adb command selected `emulator-5580`; no personal AVD, physical device, SDK,
virtualization setting, or security setting was modified. After repeated suites
caused Android's package service and system UI to become unresponsive, the exact
dedicated AVD was stopped and cold-launched with `-no-snapshot-load`. It was not
wiped. The final clean run followed that recovery.

## Automated and emulator results

Primary application/unit/lint build command at exact source `f203175`:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug lintRelease --rerun-tasks --console=plain
```

Exit 0 in 1 minute; 103/103 tasks completed. All 58 unit tests
passed with zero failures, errors, or skips. `assembleDebug`,
`assembleDebugAndroidTest`, and both lint variants passed. Debug lint reported zero
errors and 121 warnings; release lint reported zero errors and 53 warnings.

The final exact-source emulator command was:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' connectedDebugAndroidTest --rerun-tasks --console=plain
```

It passed 28/28 instrumentation tests with zero failures, errors, or skips. Gradle
exited 0 in 10 minutes 17 seconds; the XML records 570.293 test seconds. Result path:

`app/build/outputs/androidTest-results/connected/debug/TEST-Codex_GeckoView_Campaign_API_36(AVD) - 16-_app-.xml`

The final suite includes all four `ProductionGeckoSessionTest` cases plus the
prototype regression coverage. The production cases verify:

- no page, bridge activation, or Gecko child process before versioned helper consent;
- a previously installed helper remains dormant across a forced consent-version
  transition until renewed consent is recorded;
- explicit Allow and independent A/B consent;
- Cancel/Back denial, no page load, and a repeated prompt on reopen;
- cookie, localStorage, and IndexedDB persistence after closing and reopening A;
- A-to-B isolation and B-to-A restoration;
- prior browser-generation PID/name disappearance;
- bounded production stop and reopen;
- rapid A/B requests ending in only the latest authorized B session;
- exactly one production `:browser` worker; and
- the unchanged production detector content script connecting through the
  session-scoped native-message delegate and lifecycle-safe receiver into a
  synthetic account's Room row, followed by cleanup; and
- detector result validation and persistence independently of the browser bridge.

The end-to-end bridge case uses a debug-only fixture that adds obviously synthetic
DOM values only for one exact public Steam HTTPS path and query. It runs immediately
before the unchanged production `content.js`. The merged debug and release detector
scripts both match source SHA-256
`0C2CBC20A8D8BFF92D77F61540736AF60D32D1E2FE7D88469EBD4DF43403AC51`;
the release manifest contains no fixture script. Before the fix, this exact case
timed out in 33.707 seconds. After the fix it passed alone in 8.166 seconds and as
part of the four-case production class in 71.522 seconds.

Before the final source checkpoint, the production class passed three repeated
stress runs after its lifecycle repair (241.303, 228.775, and 263.444 seconds). The
final full suite is the exact-source acceptance result; the independent tester must
still repeat focused and full verification at the documentation checkpoint.

The final suite also verifies external-browser handoff by requiring the resolved
Chrome activity to become top-resumed, then foregrounds the exact prototype router
for cleanup. The corrected external-handoff plus marker-disable sequence passed
three consecutive runs (47.815, 45.762, and 51.195 seconds).

The primary found zero app-owned processes after the final run. `git diff --check`
and the clean tracked-worktree check passed at exact source `f203175`. Two initial
build launches exited before executing tests because the shell referenced a removed
JDK path and then lacked the SDK path; the installed Android Studio JBR and Android
SDK paths were verified before the bounded successful retry. The pre-install app
data clear reported no package because the freshly rebuilt APK was not installed
yet; Gradle then installed the exact APKs and ran the suite normally. An earlier
preceding run at `f2b3475` passed 26/27 but reproduced a prior prototype marker as
disabled after its interrupted reopen/stop cycle. A focused retry reproduced the
same failure, so it was repaired rather than treated as transient. The repaired
method then passed three consecutive runs (95.594, 109.575, and 103.694 seconds), and
the neighboring interrupted-screen and explicit-disable persistence cases passed
(92.203 and 69.422 seconds). Earlier failed runs exposed real graceful-shutdown and
test-foregrounding defects and were repaired; their results are superseded, not
counted as passing evidence. The first full attempt at `a00004d` timed out waiting
for its first production A marker after two bounded Gecko fallbacks. The unchanged
focused method immediately passed in 22.986 seconds after a non-wiping cold launch of
the dedicated AVD; the final full run above then passed. This diagnosed environment
retry is not counted as application proof. One earlier direct
`adb am instrument` command targeted the non-debug test package and exited 1 without
starting a test; package inspection identified the correct
`com.steamaccountmanager.app.debug.test` runner.

## Review finding and repair record

Earlier independent review and full-suite evidence found the following blockers:

- Gecko runtime creation occurred before informed detector consent;
- detector consent was not yet durable when runtime startup could force-stop the
  activity process;
- a previously installed helper was not explicitly tested across consent renewal;
- graceful Gecko shutdown could exceed the bounded stop contract;
- the prototype shared that lifecycle flaw; and
- the external-browser regression test did not independently prove foreground handoff.

The bounded repair commits are:

- `3b28923` — defer Gecko runtime creation until explicit consent;
- `efa9bbe` — cover Cancel, Android Back, and repeated prompting;
- `e4ec048` — add bounded exact-PID production shutdown fallback;
- `a10824e` — commit detector consent before Gecko activation;
- `4d09ef3` — exercise renewed consent with a previously installed helper;
- `1d1edc1` — apply the same bounded shutdown contract to the prototype;
- `bd483d9` — isolate external-handoff recovery; and
- `6b1f4b5` — independently prove external foreground handoff and router recovery;
- `f2b3475` — fail closed when detector-consent persistence fails; and
- `0712562` — give completed prototype marker state time to flush within the same
  bounded shutdown contract; and
- `a00004d` — contain both throwing persistence and throwing cache-rollback paths,
  with authorization remaining denied;
- `7164f5e` — grant content-script native messaging, bind the delegate to the exact
  Gecko session, renew consent, and add real bridge-path coverage; and
- `f203175` — align required domain/KDoc language with staged engine routing.

The prior tester/reviewer result at `1f03397` was invalidated by these source repairs
and is not current acceptance evidence. Only the exact APK listed above may enter
the phone gate after current-head tester/reviewer acceptance.

## Packaging and rollback checks

The release merged manifest and unsigned intermediary bundle contain the production
browser activity/receiver, pinned Gecko child services, Gecko `omni.ja`, native
libraries, and the built-in Steam profile detector. Searches found zero release
matches for the debug prototype activity/process or issue-6 synthetic marker. The
non-Steam WebView path and dependency remain present for rollback.

At exact source `f203175`, `bundleRelease --rerun-tasks --console=plain` rebuilt the
production assets, passed compilation, R8, lint-vital, and
`packageReleaseBundle` and then failed at `signReleaseBundle` because this checkout
has no release signing configuration. No signing key was requested, read, or
recorded. The unsigned intermediary artifacts are:

- `intermediary-bundle.aab`: 587,475,758 bytes; SHA-256
  `70FF3F7C71357E42E9378D919DF857BD4C7F086F2D15A3061563C36A9B970702`
- `base.zip`: 530,542,331 bytes; SHA-256
  `51FD2592D1E441543BC8B3E630382B526BF82D934CC501A50015158A9A6C604A`

The signing failure is an expected environment limitation, not a successful release
build. Issue #8's gate artifact is the exact debug APK above.

## Acceptance notes and limitations

- Deterministic profile mapping and contained no-backup paths have unit coverage.
- The app-owned detector is fixed APK code, not a supported or replaceable browser
  extension. Its Steam origins, public fields, and app connection require explicit
  consent per profile before activation, installation, or navigation; denial grants
  nothing.
- Production browser storage isolation is directly exercised for cookies,
  localStorage, and IndexedDB. Extension and permission isolation relies on the same
  approved per-profile topology proven in issue #7; production CSFloat installation
  intentionally belongs to issue #10 and is not pulled into issue #8.
- Steam profile/avatar inputs are bounded and restricted to approved HTTPS Steam
  hosts/CDN values. Detection failure is recoverable and does not block browsing.
- The emulator bridge case depends on public Steam HTTPS availability and injects
  only synthetic DOM on one exact debug-only fixture URL. It does not prove real Steam authentication,
  Steam Guard behavior, live avatar markup, vendor-specific behavior, or physical
  device persistence. Those are the focused phone gate below.
- The child-process allowlist matches pinned GeckoView 153's merged manifest and must
  be reviewed when GeckoView is upgraded.
- No credentials, real Steam account identifiers, authentication pages, cookies,
  tokens, trades, payments, or browser-storage exports were used or captured.

The physical-device procedure is in
[Dagkan's campaign guide](../manual-testing/geckoview-campaign-dagkan.md#issue-8-production-steam-login-smoke-test).
The exact-build smoke test is PASS and its sanitized evidence is accepted, so issue
#9 may proceed.

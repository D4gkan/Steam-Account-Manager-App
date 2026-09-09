# GeckoView issue #11 emulator verification

## Build and environment

- Source/test checkpoint: `09cb783e3e9c0588a6271beffdfbf567c4242ba0`
- Production implementation checkpoint: `09cb783e3e9c0588a6271beffdfbf567c4242ba0`
- Starting checkpoint: `1a112ab71cd0ff41caad7164a65d1acb9949f20c`
- Verification timestamp: `2026-09-08T11:40:59+02:00`
- Host: Windows 11 Pro `10.0.26200`, build 26200
- Android Studio: 2025.2.1, `AI-252.25557.131.2521.14432022`
- Variant: `debug`
- Dedicated AVD: `Codex_GeckoView_Campaign_API_36`, serial `emulator-5580`,
  Android 16 / API 36, `sdk_gphone64_x86_64`, `x86_64`
- GeckoView: `153.0.20260810162159`
- CSFloat: official signed 5.17.0, ID
  `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`, observed signed state `2`
- App APK: 599,155,833 bytes, SHA-256
  `72C58D4DB9FB363A3E569D4EBF46AC4B77DC687C04372036675048819E78FFB2`
- Test APK: 2,320,350 bytes, SHA-256
  `4A1063D70D9651DA18740FE33AE51D7B8D229CD36B6A72A7690DA46C36F758BE`

Every device command used `adb -s emulator-5580`. Installation initially lacked
temporary space, so only the prior scoped app and test packages were removed before
installing these APKs; no unrelated package or emulator state was changed.
The app used Android incremental installation because the universal APK exceeded the
package manager's temporary-space reserve. The earlier pulled `base.apk` matched its
local candidate byte-for-byte; the final focused, full-suite, and restart runs used
clean incremental installs of the exact final APK recorded above.

## Commands and results

```text
gradlew :app:compileDebugKotlin :app:compileDebugAndroidTestKotlin
BUILD SUCCESSFUL (48s)

gradlew :app:assembleDebug :app:assembleDebugAndroidTest
BUILD SUCCESSFUL (1m01s)

gradlew :app:testDebugUnitTest :app:assembleDebugAndroidTest
BUILD SUCCESSFUL (1m09s)

am instrument ...#productionCsfloatCanBeDisabledEnabledUninstalledReinstalledAndKeepsOtherSessionAbsent
OK (1 test), 93.737s

am instrument ... five focused production CSFloat methods
OK (5 tests), 272.413s

post-repair amended lifecycle tracer, consecutive run 1
OK (1 test), 85.109s

post-repair amended lifecycle tracer, consecutive run 2
OK (1 test), 82.363s

post-repair five focused production CSFloat methods
OK (5 tests), 115.656s

clean-install fixed-profile default phase
OK (1 test), 36.953s

adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug

same method with -e issue11RestartPhase verify-after-force-stop
OK (1 test), 8.073s

bounded-inspection repair, clean exact install, lifecycle run 1
OK (1 test), 44.687s

bounded-inspection repair, second clean exact install, lifecycle run 2
OK (1 test), 44.640s

gradlew testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug lintRelease --rerun-tasks
BUILD SUCCESSFUL (1m08s), 103/103 tasks; 70/70 unit tests; zero lint errors

fresh exact install; pulled app and test base APKs
local/device size and SHA-256 matched for both APKs

full instrumentation, first post-repair run
33/34 passed; the pre-existing navigation-gate test missed its Back readiness timeout

isolated navigationGateExposesControlsAndBlocksWithoutAutomaticHandoff
OK (1 test), 13.014s

clean exact reinstall; diagnosed full-suite retry
OK (34 tests), 573.607s

clean exact reinstall; fixed-profile default phase
OK (1 test), 48.660s

adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug

same method with -e issue11RestartPhase verify-after-force-stop
OK (1 test), 12.203s

durable restoration fence, clean exact install, lifecycle run 1
OK (1 test), 51.904s

durable restoration fence, second clean exact install, lifecycle run 2
OK (1 test), 51.074s

shared-owner + controller-update candidate focused lifecycle run
OK (1 test), 55.454s

gradlew testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug lintRelease --rerun-tasks
BUILD SUCCESSFUL (1m04s), 103/103 tasks; 70/70 unit tests; zero lint errors

fresh exact install; pulled app and test base APKs
local/device size and SHA-256 matched for both APKs

full shared-owner candidate instrumentation
OK (34 tests), 620.066s

clean exact reinstall; shared-owner fixed-profile default phase
OK (1 test), 52.625s

adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug

same method with -e issue11RestartPhase verify-after-force-stop
OK (1 test), 12.533s
```

The five-test run covered install denial and acceptance, callback-derived required
permission display, unavailable/available/opened popup ownership, fail-closed denied
verification, cleanup failure/retry, exact disable/enable, exact uninstall/reinstall,
pinned update denial, and A/B profile isolation. The revocation tracer also stopped
and recreated the dedicated browser process and reopened both routes, proving A
restored enabled while B remained absent. Its amended screen-close/reopen assertion
passed twice consecutively after repair and the complete unit suite passed.

Before repair, the exact amended source failed twice after Disable, browser-screen
close/reopen, and explicit Enable: the test timed out at line 531 waiting for the
exact enabled state. A later diagnostic run passed in 96.525s, identifying an
intermittent Gecko callback/list propagation race rather than an install-network
failure. A single delayed inspection remained insufficient in a later exact-candidate
run, which reproduced the same line-543 failure. The bounded repair retains
quarantine after the mutation callback and, only while a non-null list still contains
the exact reviewed extension with its previous enabled flag, reinspects every 500ms
for at most 25 seconds. It does not retry the mutation. Null, absent, wrong-identity,
wrong-version/signature, and exhausted previous-state results remain recoverable
fail-closed failures. Two clean exact-install lifecycle runs passed consecutively in
44.687s and 44.640s after this repair.

Primary exact-head verification then rebuilt every required task and installed the
fresh universal app APK incrementally. Pulled device APKs matched the local files
byte-for-byte. The first full post-repair suite had one unrelated navigation timing
failure after 25 preceding tests; that same test passed alone in 13.014s. A clean,
diagnosed full-suite retry passed all 34 tests in 573.607s. The required external
whole-app force-stop sequence then passed in fresh target processes: the default
phase left A exact enabled and B absent, and the verification phase restored those
states after force-stop. The emulator network throttle was set to `full` before the
successful runs after a prior run showed only official-artifact download timeouts;
the host artifact returned HTTP 200 with the pinned 7,011,169-byte length, and the
emulator reported a validated network with the artifact host's port 443 reachable.

The final reviewer identified that a screen-local generation could not own an
in-flight Gecko mutation across activity replacement. The final repair gives each
screen a process/profile-scoped operation token while the profile-local pending file
remains the process-death fence. Screen release invalidates the token globally, and
cleanup, denied-install verification, discovery, mutation, install, update, delayed
polling, and nested callbacks all require current ownership before changing pending
state, trust, installed-extension state, or trusted UI. The public lifecycle test now
closes and reopens during both Enable and accepted Reinstall. The debug update action
also awaits the real `WebExtensionController.update` attempt; Gecko's documented null
no-update result and an exact returned result both require a fresh exact signed-enabled
re-list, while changed metadata quarantines. The final exact candidate passed the
focused lifecycle test, 34/34 full instrumentation, and the external force-stop
sequence with no owned process left running.

Immediately after the incremental reinstall, two setup attempts timed out before the
initial detector-consent screen because an Android `System UI isn't responding`
dialog covered the launcher; UI hierarchy confirmed no product activity was resumed.
After choosing the system dialog's Wait action, all required post-repair runs passed.

## Final acceptance-repair checkpoint

The fresh xhigh review of `effce1739e4d58d41bc4e7ba6f01c40e8d39c746`
found missing app-owned tracking state, stale install trust after restoration, mutation
controls exposed during interrupted restoration, an update error reported like a
successful no-update, and an isolation test whose second session was never enabled.
The test commit `f69442c` exposes those contracts. Implementation commit `09cb783`
repairs them without a new dependency, file, service, schema, extension artifact, or
production browser abstraction.

```text
gradlew testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug lintRelease --rerun-tasks
BUILD SUCCESSFUL (55s), 103/103 tasks; 71/71 unit tests; zero lint errors

focused tracking/failure/isolation public journey
OK (1 test), 16.036s

focused two-installed-session revocation/recovery/lifecycle journey
OK (1 test), 60.066s

clean exact-install full instrumentation retry
OK (34 tests), 1,382.335s

clean exact reinstall; fixed-profile default phase
OK (1 test), 90.073s

adb -s emulator-5580 shell am force-stop com.steamaccountmanager.app.debug

same method with -e issue11RestartPhase verify-after-force-stop
OK (1 test), 8.819s

pulled installed app and test base APKs
local/device sizes and SHA-256 values matched for both artifacts
```

Unit XML is under `app/build/test-results/testDebugUnitTest/`. Lint reports are
`app/build/reports/lint-results-debug.html` and
`app/build/reports/lint-results-release.html`. The final successful manual
instrumentation commands returned exit code zero and left no app-owned process.

The first full final-candidate run passed 33/34; a pre-existing synthetic navigation
page missed one readiness bound and then passed alone in 36.291s. A second full run
was invalid because it reused the first run's enabled synthetic profiles instead of
clean-installing. After diagnosis and a clean exact reinstall, the complete 34-test
matrix passed in one run. Restart checks attempted immediately after that matrix
encountered the ordinary Steam-profile consent dialog because later tests had
rewritten other consent keys from a process-local preference cache. The final ordered
proof therefore used the established clean-install, focused-setup, external
force-stop, and verification sequence; both exact enabled profiles restored.

The app-owned tracking row now reports inactive for absent/disabled state, unknown
for an exact enabled package whose official status has not been visibly confirmed,
active only after the user records the visible official popup status, and failed for
discovery, popup, or background failure. Failure exposes a retry and never reports
active. The debug failure path is deterministic; it does not alter or impersonate the
official extension.

The second session is installed and enabled before the first session is mutated. Its
exact signed enabled state is rechecked after the first session's failed-disable
retry, disable, enable, pinned update/no-update, update failure/recovery, uninstall,
reinstall, activity recreation, browser-worker restart, and external app force-stop.
The activity recreation is performed through the production activity with a
debug-only one-time completion marker.

## Acceptance mapping

- Visible installed/enabled state comes only from `WebExtensionController.list()`
  metadata. App-owned tracking state distinguishes inactive, unknown,
  user-confirmed visible active, and failed; no automated background-success claim is
  made.
- Disable and enable durably quarantine and blank browsing before mutation, await the
  Gecko callback, then require a non-null list with the exact reviewed ID, version,
  signed state, and requested enabled flag before restoring browsing.
- Enable and reinstall persist a profile-local pending-restoration marker before
  mutation. A process/profile-scoped ownership token invalidates callbacks from a
  released screen. A replacement screen stays quarantined while exact metadata is
  stale or absent; only its current-owner fresh exact enabled re-list clears pending
  state and quarantine. The public lifecycle test closes/reopens immediately after
  Enable and accepted reinstall.
- Uninstall reuses the hardened cleanup path and restores only after list-confirmed
  absence. Reinstall reuses the verified installer and Gecko prompt delegate.
- The debug update trigger awaits the production prompt delegate's actual `DENY`,
  invokes and awaits `WebExtensionController.update`, and then re-lists the exact
  signed enabled package before reporting unchanged state. The pinned reviewed XPI
  has no `update_url`; null/no-update is never trusted without that exact re-list.
- Screen close/reopen, A/B process switching, explicit browser-process recreation,
  and route reopen are public production-shell checks. The existing production
  session lifecycle test separately covers repeated close/reopen, profile switching,
  prior-generation death, explicit worker stop/reopen, and latest-request routing.
- The fixed-profile default phase ended with A and B exact enabled, then stopped the
  browser while preserving both Gecko profiles. After an external whole-app
  force-stop, the same test method's verification phase ran in a fresh target
  process, opened A and observed exact enabled state, switched to B and observed the
  same exact enabled state, then stopped the browser. No app-owned process remained.

No credentials, cookies, tokens, trade contents, account identity, screenshots, or
URLs containing sensitive state were recorded.

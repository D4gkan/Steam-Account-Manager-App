# Issue #10 production CSFloat verification receipt

Status: **Machine/emulator verification PASS at application/test source `e4ee283`**

## Exact candidate

- Application/test source: `e4ee283c4d65347056e7732b103ef6d8aa3fd45a`
- Starting checkpoint: `31f9fadbf16dd3aa1defc4c4aff132def1f738f7`
- Branch: `codex/geckoview-campaign`
- Variant: debug
- Preserved evidence directory:
  `C:\Users\esmer\AppData\Local\Temp\sam-gv10-d88e5d4-primary`
- `app-debug.apk`: 599,073,913 bytes; SHA-256
  `7B1F7AF2BD3CD8817D2ABFA5A3FD4098DDBFC221DE5A7D9A0C31BC6DEDDB70F0`
- `app-debug-androidTest.apk`: 2,305,102 bytes; SHA-256
  `E6BE00409CFA52CF951385C73FF6267AB3F10A5E9FCD8108191D5E2E0367AF35`
- Verification completed: 2026-09-07 16:36 CEST

## Approved extension artifact

- Source: `https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi`
- Extension ID: `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`
- Version: `5.17.0`
- Size: 7,011,169 bytes
- SHA-256:
  `70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D`
- Gecko signature state required after installation: `2` (signed)
- GeckoView: `153.0.20260810162159`
- Update policy: the reviewed package/version is pinned; automatic extension updates
  are not enabled in this campaign.

The production flow downloads this exact package to app-private temporary storage,
verifies its size and SHA-256 while streaming, then asks GeckoView to install the
unmodified file. Installation is accepted only when GeckoView reports the exact
ID, version, and signed state above. The package was not forked, repacked, modified,
silently authorized, or replaced.

## What changed

The production Gecko browser now offers an explicit CSFloat install flow. Before
installation it displays the extension name and every capability, origin, and data
collection item reported by GeckoView. The user may deny or accept. Denial leaves
ordinary browsing usable. Acceptance installs the verified official package, and
the browser exposes the official signed popup without fabricating a Firefox-only
Steam permission prompt.

Install, disabled, update-policy, popup-available, popup-opened, and failure states
are visible. Failed install/popup and cleanup operations remain retryable and retain
external-browser recovery. The app does not infer or self-record live tracking; it
directs the user to inspect tracking status inside the official popup. Extension
state remains in the approved isolated Gecko runtime for the selected
`(account, website)` session.

The official Manifest V3 package declares `src/popup.html` as its action popup. The
browser derives the popup URL only from GeckoView's enabled extension object,
requires a root `moz-extension://` base, and appends that fixed reviewed path. It
does not use hidden APIs, reflection, a WebView shim, or a synthetic popup.

## Environment

- Host: Windows 11 Pro build 26200
- Android Studio: 2025.2.1, `AI-252.25557.131.2521.14432022`
- Dedicated AVD: `Codex_GeckoView_Campaign_API_36`
- Exact adb serial: `emulator-5580`
- Emulator model: `sdk_gphone64_x86_64`
- Android: 16 / API 36
- ABI: x86_64

Every device command selected `emulator-5580`. No personal AVD, physical device,
SDK, virtualization setting, firmware setting, or security setting was changed.
The AVD was not wiped. Its small data partition cannot stage the approximately
599 MB multi-ABI debug APK conventionally, so Android's supported incremental
installer was used for the main APK; the small test APK used streamed install.

## Automated and emulator results

The behavioral contract commit `58217a2` was genuinely red: the focused unit
command failed to compile because `CsfloatExtensionContract` did not exist. The
subsequent feature and bounded repair commits made the contract and public-behavior
journeys pass. Review then rejected the app's unsupported action/active wording and
fire-and-forget cleanup. Commit `6b147c9` added a genuinely red truthful-popup
contract; `6e9a1a5` removed the app-owned tracking assertion; `8331f10` made cleanup
fail closed; and `d98eedb` removed stale tracking claims from proof names.

Independent testing then found that a failed post-denial inspection could restore
browsing without proving that the extension was absent or disabled. Commits
`3ac6f71` and `a6e4c99` added a public recovery journey and made that uncertainty
fail closed: the embedded page is blanked, installation stays disabled, and retry
re-inspects or removes the extension before restoring the preserved safe URL.
Commit `f172a32` asserts that the disabled controls are visible to the user.

Fresh xhigh review then found that blanking was not a complete quarantine: browser
navigation controls remained usable, the uncertain state was lost on restart, and
the detector could race startup inspection and load Steam too early. Commits
`be97c11` through `de7bdd7` add public navigation/lifecycle coverage and one durable
per-profile quarantine. Denial and cleanup enter it before asynchronous inspection;
Back, Forward, Refresh, installation, and all non-blank in-app loads are blocked;
startup waits for both detector readiness and extension trust inspection; and only
confirmed absence/disablement clears the marker and restores the preserved safe URL.

A second final review found that positive quarantine-marker write failure, nullable
Gecko list results, and persisted full recovery URLs still left failure/privacy
gaps. Commits `ce17ca3` through `a07a64e` invert the durable state: a tiny
`.csfloat-trusted` sentinel inside the deterministic no-backup Gecko profile means
the last extension state was verified; marker absence defaults to quarantine.
Installation removes trust before downloading, and only verified absence,
disablement, cleanup, or a freshly consented exact signed install may recreate it.
Boolean failures and ordinary I/O exceptions keep the session blank and retryable.
Successful-null extension lists now fail closed, and no URL is persisted at all.
The current authorized launch URL is kept only in memory for external recovery.

A third final review exposed a startup-list/install race, untruthful recovery when
the trusted marker could not be recreated, and an implicit rather than explicit
tracking-state proof. Commits `fea5ba2` through `e4ee283` keep installation disabled
until startup trust inspection completes, retain a visible retryable failed state
when quarantine clearance fails, and prove the real public Firefox transition from
absent/unavailable to the installed official popup's enabled tracking label. No
Chromium permission toggle was introduced or simulated.

The fresh unit/build/lint command at exact source `e4ee283` was:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug lintRelease --rerun-tasks --console=plain
```

Exit 0 in 60 seconds; all 103 tasks executed. All 70 unit tests passed with
zero failures, errors, or skips. Debug and Android-test APK assembly passed. Debug
lint reported 123 warnings and zero errors; release lint reported 55 warnings and
zero errors. The result XML files are under
`app\build\test-results\testDebugUnitTest`, while lint XML is under
`app\build\reports`.

The exact APK install commands were:

```powershell
$adb = 'C:\Users\esmer\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb -s emulator-5580 install --incremental app\build\outputs\apk\debug\app-debug.apk
& $adb -s emulator-5580 install -r app\build\outputs\apk\androidTest\debug\app-debug-androidTest.apk
```

The dedicated AVD remained storage-constrained. After verifying the exact package
names, only the campaign-owned debug and test packages were uninstalled; both
removals exited 0. The exact `e4ee283` main APK then installed incrementally and the
exact test APK installed by streaming, both with exit 0.

The final full emulator command was:

```powershell
& $adb -s emulator-5580 shell am instrument -w -r com.steamaccountmanager.app.debug.test/androidx.test.runner.AndroidJUnitRunner
```

Exit 0; 33/33 tests passed in 426.471 seconds. The runner exercised the complete
production CSFloat denial and acceptance paths; official-popup rendering;
popup-failure/retry; cleanup-failure, immediate safe blanking, retry, and
list-confirmed absence; denied-verification failure, safe blanking, disabled
installation, retry, and confirmed recovery; quarantine-disabled navigation;
close/reopen and process-restart quarantine persistence; startup inspection before
Steam loading; A-enabled/B-absent/A-enabled isolation; ordinary browsing after
denial; external recovery; production browser navigation; process lifecycle;
persistence; detector boundaries; and all earlier prototype regressions.
Accessibility assertions observed the real official popup label `Offer Tracking
Enabled`. That label proves required permission in this artifact, not a live
tracking update, and the app does not claim otherwise.

The focused issue #10 transition proof at `e4ee283` first observed CSFloat absent,
the popup unavailable, and its open control disabled. After explicit acceptance of
the callback-derived install prompt, it observed the exact signed package enabled,
the official popup available and opened, and the genuine popup label `Offer Tracking
Enabled`. The three focused production journeys passed 3/3 in 55.048 seconds on
`emulator-5580`. This is the approved Firefox public-state transition; it is not a
Chromium optional-permission toggle and does not claim a live tracking update.

After the run, the app and test packages were force-stopped and `pidof` returned no
app-owned main, Gecko, or Gecko-child process. `git diff --check` passed and the
tracked worktree was clean at exact application/test source `e4ee283` before this
receipt-only update.

## Security, privacy, and limitations

- The install trust boundary checks the downloaded byte count and SHA-256 before
  GeckoView validates the manifest and Mozilla signature.
- Consent content comes from GeckoView's install prompt. Required permissions,
  origins (including Steam API access), and data-collection items are not replaced
  by an app-maintained summary.
- Dismissal or denial fails closed. Optional host and update prompts are denied;
  no Chromium-style optional Steam prompt is shown or simulated.
- The popup destination cannot come from website content or user input. It is built
  from the enabled, exact-ID signed extension base and the reviewed manifest path.
- Rejected-package cleanup immediately blanks the embedded session, waits for
  uninstall completion, reinspects installed state, and restores browsing only
  after confirming absence. Failure stays blank and popup-unavailable with explicit
  cleanup retry and the prior safe HTTP(S) destination preserved for external use.
- A successful-null installed-extension result is an inspection failure, never
  proof of absence. The only durable control value is the empty `.csfloat-trusted`
  sentinel inside the app's no-backup per-profile directory; no recovery URL,
  query, fragment, account evidence, cookie, or token is persisted by this flow.
- The deterministic popup/cleanup failure controls exist only in debuggable builds;
  they exercise the production recovery paths and are absent from release builds.
- State is not shared with another `(account, website)` runtime. The emulator test
  proves A/B separation through the production process/profile topology.
- No credentials, Steam Guard codes, QR payloads, cookies/tokens, account IDs,
  trades, payment data, browser storage, or authentication screenshots were
  requested, captured, logged, committed, or uploaded.
- The API-36 x86_64 emulator proves the automated production flow with synthetic
  public fixtures. It does not prove a real Steam authentication session, live or
  long-duration tracking, every vendor device, future CSFloat versions, or packages
  other than the exact approved CSFloat artifact. Issue #7's official GO records
  the separate authenticated live tracking proof. Other extensions remain outside
  issue #10 and this campaign.

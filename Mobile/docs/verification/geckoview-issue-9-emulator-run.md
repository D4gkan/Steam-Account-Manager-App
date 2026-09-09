# Issue #9 Gecko browser-shell verification receipt

Status: **Machine/emulator verification PASS at application/test source `adf0b90`**

## Exact candidate

- Application/test source: `adf0b90b0cb2c91cb944d86ef8d10eb747c07929`
- Starting checkpoint: `d917180386f2d280bc37805f3e4e0533a3788df2`
- Branch: `codex/geckoview-campaign`
- Variant: debug
- Preserved evidence directory:
  `C:\Users\esmer\AppData\Local\Temp\sam-gv9-adf0b90`
- `app-debug.apk`: 598,942,841 bytes; SHA-256
  `1C1D65558E81F043EDC912B3C2AD196A496F7D2E7100E81067A872C7108BB55A`
- `app-debug-androidTest.apk`: 2,286,734 bytes; SHA-256
  `2646EE15239667EEBA29222C1FA4272AE0266E16EF7868ABBE69E3170484C410`
- Full instrumentation XML: 5,067 bytes; SHA-256
  `1E514023F96F1C5C86A2FC84CDAF89BA6D694B87D5A65C056364C782DD2231BA`
- Verification completed: 2026-09-07 10:12 CEST

## What changed

The existing GeckoView browser shell now applies one pure navigation decision at
the WebView and GeckoView trust boundaries. Allowed HTTP(S) primary/auth hosts stay
in-app. A well-formed unrelated HTTP(S) destination remains blocked until the user
chooses an external browser. Malformed URLs, URLs containing user information, and
non-web schemes fail closed without an external offer or in-app load.

Gecko load errors now distinguish a rejected destination from an ordinary main-page
failure without displaying either destination in the error text. **Try again** loads
the failed allowed URL rather than reloading the last successful page. The existing
Close, title, progress, Back, Forward, Refresh, blocked-navigation explanation, and
external handoff remain in the same browser screen. No account/profile identity,
detector consent, extension, runtime, process, database, or dependency code changed.

## Environment

- Host: Windows 11 Pro build 26200
- Android Studio: 2025.2.1, `AI-252.25557.131.2521.14432022`
- Dedicated AVD: `Codex_GeckoView_Campaign_API_36`
- Exact adb serial: `emulator-5580`
- Android: 16 / API 36
- ABI: x86_64
- Emulator model: `sdk_gphone64_x86_64`

Every device command selected `emulator-5580`. No personal AVD, physical device,
SDK, virtualization setting, or security setting was changed. Before the final full
run, only the dedicated AVD was cold-started with `-no-snapshot-load`; it was not
wiped.

## Automated and emulator results

The focused policy baseline passed before implementation. The behavioral RED commit
`19f7e8c` then failed compilation because `NavigationDecision` and
`decideNavigation` did not exist. The minimal implementation commit `1a11e5c` made
the policy test pass. Commits `db90487` and `adf0b90` repaired failed-URL retry and
added the production traversal.

Final unit/build/lint command at exact source `adf0b90`:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug lintRelease --rerun-tasks --console=plain
```

Exit 0 in 51 seconds; 103/103 tasks completed. All 59 unit tests passed with
zero failures, errors, or skips. Debug and Android-test APK assembly passed. Debug
lint reported 121 warnings and zero errors; release lint reported 53 warnings and
zero errors.

The final focused shell traversal used:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' connectedDebugAndroidTest '-Pandroid.testInstrumentationRunnerArguments.class=com.steamaccountmanager.app.ProductionGeckoSessionTest#productionGeckoBrowserShellTraversesPolicyHistoryRecoveryAndClose' --console=plain
```

Exit 0 in 31 seconds; 1/1 passed. Accessibility automation exercised an allowed
page, a real same-host HTTP redirect, title changes, Back, Forward, Refresh, blocked
unrelated HTTPS, Stay here, external-browser handoff and return, safe non-web
refusal, a main-page connection failure, retry of the failed URL, successful
recovery, and Close. Separate policy tests cover configured primary/auth hosts,
subdomains, case, suffix confusion, malformed values, user information, and
fail-closed non-web schemes.

The exact final full-suite command was:

```powershell
$env:ANDROID_HOME = 'C:\Users\esmer\AppData\Local\Android\Sdk'
$env:ANDROID_SERIAL = 'emulator-5580'
.\gradlew.bat '-Dorg.gradle.java.home=C:/Program Files/Android/Android Studio/jbr' connectedDebugAndroidTest --rerun-tasks --console=plain
```

Exit 0 in 6 minutes 1 second; 29/29 tests passed with zero failures, errors, or
skips. The XML records 307.535 test seconds. No app-owned process remained after the
run. `git diff --check` passed and the tracked worktree was clean at the exact source
checkpoint.

## Diagnosed pre-final runs

Pre-final focused runs exposed four measurable gaps and were not counted as passing
evidence: a `localhost`/IPv4 fixture mismatch, Gecko's alternate non-web error path,
transparent retry of a single dropped socket, and **Try again** reloading the last
successful page. Each next run crossed the prior boundary. The final fixture keeps
the connection unavailable until the retry UI is observed, then enables recovery.

The first full 29-test run passed all issue #9 behavior but one historical issue #6
prototype marker-restart case did not show a fixed state after accumulated emulator
activity (28/29, exit 1 in 8 minutes 27 seconds). That exact method immediately
passed alone (1/1, exit 0 in 1 minute 11 seconds), zero app processes remained, and
the dedicated AVD was cold-started without wiping. The single final full retry then
passed 29/29. The first restart launch occurred while port 5580 was still in
`TIME_WAIT` and did not register a device within the 50-second bound; process/port
inspection preceded the one successful launch retry.

## Security, privacy, and limitations

- The app never sends rejected non-web or malformed destinations to `ACTION_VIEW`.
- External handoff is limited to well-formed HTTP(S) with a host and no user info,
  remains user-confirmed for blocked destinations, and does not log or display the
  destination.
- The navigation policy still uses exact host or subdomain matching; substring and
  suffix-confusion hosts remain rejected.
- Error messages and fixtures contain fixed synthetic values only. No credentials,
  Steam Guard data, cookies/tokens, account identifiers, browser storage, trade or
  payment data, or authentication screenshots were captured.
- The same-host emulator redirect proves Gecko redirect handling. Configured
  cross-host authentication allowlisting is proven separately by the pure policy
  suite; no real authentication was required for issue #9.
- Accessibility automation proves the supported browser-shell flow on the dedicated
  API-36 x86_64 AVD. It does not claim every external app, vendor device, network
  failure, popup, or future page behavior.

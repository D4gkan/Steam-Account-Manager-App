# GeckoView and CSFloat prototype verification contract

## Purpose

This contract is the acceptance gate between the disposable GeckoView prototype and
production migration described by
[issue #3](https://github.com/D4gkan/Steam-Account-Manager-App/issues/3). It tests
externally visible behavior and the application's isolation guarantees; it does not
test GeckoView internals.

The result is binary:

- `GO`: every required scenario passes with reviewable evidence on an emulator and at
  least one supported real Android device.
- `NO-GO`: any required scenario fails or lacks evidence. Production migration remains
  blocked.

## Approved permission and revocation semantics

The official CSFloat Firefox 5.17.0 build promotes its Steam API host permission to a
required install-time permission and reports no optional runtime permissions. The
parent issue's granular runtime deny/grant/revoke/re-grant contract is therefore not
available from the current official unmodified package.

The approved contract is explicit install-time consent for all required permissions.
After installation, revocation disables or uninstalls CSFloat only within the affected
isolated browser session. Restoration explicitly enables or reinstalls it, repeating
required install-time consent where GeckoView requests it. The prototype gate fails if
those operations also change another browser session or cannot be isolated.

## Implementation issue graph

The GitHub issues are the live implementation sequence. Their `Blocked by` sections
are the canonical dependency edges when native GitHub dependency management is not
available to the authenticated account.

| Stage | Issue | Contract coverage |
| --- | --- | --- |
| Prototype engine, install consent, and injection | [#4](https://github.com/D4gkan/Steam-Account-Manager-App/issues/4) | Deterministic GV-01, GV-02, and GV-04–GV-07 preparation |
| Prototype action and tracking controls | [#5](https://github.com/D4gkan/Steam-Account-Manager-App/issues/5) | GV-08 automation and diagnostics |
| Prototype isolation and lifecycle | [#6](https://github.com/D4gkan/Steam-Account-Manager-App/issues/6) | GV-09–GV-14 and the matrices |
| Live compatibility `GO`/`NO-GO` | [#7](https://github.com/D4gkan/Steam-Account-Manager-App/issues/7) | GV-01–GV-16 with test accounts, emulator, and real device |
| Production isolated session | [#8](https://github.com/D4gkan/Steam-Account-Manager-App/issues/8) | Evidence-backed production topology |
| Browser-shell parity | [#9](https://github.com/D4gkan/Steam-Account-Manager-App/issues/9) | GV-15–GV-16 and navigation controls |
| Production CSFloat flow | [#10](https://github.com/D4gkan/Steam-Account-Manager-App/issues/10) | Install, consent, action, and tracking |
| Revocation and restart safety | [#11](https://github.com/D4gkan/Steam-Account-Manager-App/issues/11) | Permission and lifecycle regression matrix |
| Final GeckoView cutover | [#12](https://github.com/D4gkan/Steam-Account-Manager-App/issues/12) | Full contract and WebView removal proof |

Issues #8–#12 must not start unless issue #7 records `GO`, even if an individual
issue's direct blocker is otherwise complete.

## Safety and prerequisites

- Use two dedicated test Steam accounts with no valuable inventory or payment method.
- Never attach passwords, cookies, session tokens, trade contents, personal account
  identifiers, or unredacted authentication screenshots.
- Install the official, unmodified, Firefox-compatible CSFloat package.
- Record the exact source URI, extension ID and version, observed signature state,
  GeckoView version, app commit, build variant, Android version, device/emulator model,
  and test timestamp.
- Capture enough diagnostics to reproduce a failure without exposing browser state.
- Treat real network behavior as nondeterministic: record timestamps and distinguish
  app failures from Steam, CSFloat, or network outages.

## Evidence record

Create one record per test run. Store non-sensitive text evidence in the implementing
issue or a linked repository artifact. Screenshots and logs must be redacted before
upload.

| Field | Value |
| --- | --- |
| App commit and build variant | |
| GeckoView version/channel | |
| CSFloat source URI, ID, version, signature state | |
| Android version and device/emulator | |
| Test timestamp and tester | |
| Runtime/profile/process topology | |
| APK-size and representative memory delta | |
| Result (`GO`, `NO-GO`, or `INCOMPLETE`) | |
| Known limitations and linked failures | |

## Required scenarios

Each row needs a result and an evidence link. `Partial`, `assumed`, or desktop-Firefox
evidence does not pass a row.

| ID | Scenario | Required observable result | Result | Evidence |
| --- | --- | --- | --- | --- |
| GV-01 | Start the prototype | A separately launchable debug/prototype path opens a page using the pinned GeckoView build without replacing production WebView. | | |
| GV-02 | Install CSFloat | GeckoView installs and starts the official signed Firefox-compatible package; package metadata and failures are visible. | | |
| GV-03 | Authenticate with Steam | Steam Community loads and the test account can authenticate interactively without the prototype intercepting, newly persisting, or logging credentials; any existing transient buffer follows its documented clearing contract. | | |
| GV-04 | Inject CSFloat | A relevant Steam inventory or trade page visibly receives the expected CSFloat content injection. | | |
| GV-05 | Display install access | The install prompt identifies CSFloat and all required capabilities and origins, including Steam API host access, before consent. | | |
| GV-06 | Deny installation | Denial leaves the extension and tracking disabled and produces a useful explanation. | | |
| GV-07 | Accept installation | Acceptance installs and starts the signed extension with exactly the required access shown; the Firefox path does not claim a runtime optional-permission request. | | |
| GV-08 | Enable tracking | The extension action/popup or equivalent consent-preserving control enables tracking and produces an observable CSFloat status update. | | |
| GV-09 | Close and reopen screen | The same browser session restores the correct authentication, extension access, and tracking state. | | |
| GV-10 | Restart the app | The same browser session restores the correct state and background alarm/tracking behavior after a full app restart. | | |
| GV-11 | Isolate two browser sessions | Two `(account, website)` sessions do not share cookies, authenticated identity, local storage, extension storage, permission state, or CSFloat tracking state. | | |
| GV-12 | Switch repeatedly | Repeated account switching never exposes the other account and does not require every possible browser session to remain resident. | | |
| GV-13 | Revoke extension access | Disabling or uninstalling CSFloat removes its access and disables tracking only within the affected isolated browser session. | | |
| GV-14 | Restore extension access | An explicit enable or reinstall restores CSFloat only within the affected browser session and repeats install-time consent when requested. | | |
| GV-15 | Preserve navigation policy | Allowed pages and authentication redirects load in-app; unrelated destinations are blocked and offered externally. | | |
| GV-16 | Recover from errors | Install, permission, load, and extension failures show actionable, non-sensitive diagnostics and leave external-browser recovery available. | | |

## Isolation matrix

Run the matrix with browser session A active, browser session B active, after switching
A → B → A, and after restarting the app. Record engine-observed state, not only app
metadata.

| State | Must persist within one browser session | Must differ across browser sessions |
| --- | --- | --- |
| Steam authentication/cookies | Yes | Yes |
| Site local storage and IndexedDB | Yes | Yes |
| CSFloat extension storage | Yes | Yes |
| Required permission set and extension installed/enabled state | Yes | Yes |
| Tracking enabled/status state | Yes | Yes |
| Navigation history and visible identity | As designed and documented | Yes |

A design that proves cookie partitioning but leaves extension storage or permissions
shared fails the gate.

## Lifecycle matrix

For each transition, verify the visible account, authentication, permission, tracking,
and failure state.

| Transition | Required behavior |
| --- | --- |
| Compose recomposition | No duplicate install/prompt and no state loss |
| Activity recreation | Correct browser session and UI state restored |
| Browser screen close/reopen | Correct persistent browser and extension state restored |
| Browser process recreation | Correct isolation identity reopened without cross-session state |
| Full app restart | Correct browser and extension state restored |
| Extension/background-process failure | Recoverable error; tracking is not falsely shown as active |

## Navigation and browser-shell parity

The prototype need only provide controls required to exercise the gate. Production
parity work remains blocked until `GO`. The gate must nevertheless prove that
GeckoView delegates can preserve the current allowlist rule, blocked-navigation
external handoff, useful load errors, and back/forward/reload behavior.

## Gate decision

The gate issue records:

1. every scenario result and evidence link;
2. the selected runtime/profile/process topology and why it satisfies the isolation
   matrix;
3. the signed-package installation and update approach;
4. the exact pinned dependency versions;
5. the APK-size, memory, device-support, and reauthentication effects;
6. all known limitations and follow-up risks; and
7. `GO` or `NO-GO`, with reviewer acknowledgement.

On `GO`, update ADR-0001 with the resolved topology and distribution decisions, then
close issue #7 to release issue #8 to the frontier. On `NO-GO`, set issue #7's body
status to `needs-info` and leave it open as the blocking sentinel for issues #8–#12.
Document the failed assumptions; do not introduce a WebView extension shim or weaken
consent or isolation requirements.

## Upgrade contract

After production cutover, rerun GV-02 through GV-16 whenever the pinned GeckoView
version, CSFloat package/version/source, extension permission manifest, or supported
Android range changes. A dependency update is not release-ready until the new evidence
record passes on an emulator and a supported real device.

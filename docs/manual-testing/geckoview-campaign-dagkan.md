For the final three-extension candidate, use [Final Samsung verification](geckoview-final-release.md).

# GeckoView campaign manual testing for Dagkan

## Device-test release check

This procedure describes candidate `9e254b2aa8715e3e3703b80e91302cd6db531e21`.
The released candidate has completed the human emulator and physical-device gate as
recorded below. Never substitute the rejected `17026da` or historical `b81eeab` APK.
Machine evidence and repair history are maintained in the receipt, not inferred from
this procedure.
The [receipt](../verification/geckoview-issue-7-emulator-run.md) preserves the failed
baseline, rejected experiments, native port-race evidence, and exact candidate artifacts.

Codex owns APK checksum verification and emulator/build/test/technical screenshot
evidence. After explicit release of the device gate, the user supplies observed
PASS/FAIL outcomes, Samsung model/Android version, and reauthentication notes only.
Credentials are entered only on the test device, never sent to agents. A phone pass
does not replace the emulator's live authentication and two-account proof.
Issue #7 records `GO` and is closed. Medium tester and fresh xhigh GO-basis reviews
passed exact checkpoint `062da23946c2f306f5a981c356f67a1da219de8d` with no
reviewer blockers, and ADR-0001 records the gate decisions. Production #8 is released
after this finalization is committed and synchronized to the public repository.

This is the living human-test guide for the GeckoView migration campaign. Run only
the gate whose APK metadata is complete. A gate passes only when every required
expected result is observed. Mark an unexpected or missing result `FAIL`; do not
change the acceptance criteria to make a run pass.

# Issue #7 compatibility GO/NO-GO

## What changed

A separate debug prototype now opens the official, signed Firefox CSFloat extension
inside GeckoView. Browser state and extension state are stored separately for test
slots A and B, and only the selected slot's browser process remains active. This is
the final compatibility check before any production browser migration may begin.

## Before you start

**Do not start without the latest receipt's explicit release for this exact build.**

- Candidate source: `9e254b2aa8715e3e3703b80e91302cd6db531e21` (app source unchanged from `c8f3be7`).
- Codex preserves and verifies `C:\Users\esmer\AppData\Local\Temp\sam-gv7-final-9e254b2\app-debug.apk`.
- Size: 598,810,380 bytes; SHA-256:
  `D6E639CF0F69915BB065FE2904B112C8A63AA9A426CDE7A5B8EDB9977E32DA89`.
  No PowerShell or checksum work is required from the user.
- Physical device: Samsung Galaxy S25 Ultra, Android 16.
- Run the complete procedure once on the dedicated emulator and once on a supported
  physical Android device running Android 9/API 28 or newer. Codex records the
  emulator's API level and CPU ABI. For the phone, share its exact model and Android
  version; include API/ABI only if already known. Do not use a personal emulator or
  clear a physical device that you do not own for this test.
- Use two dedicated Steam test accounts, called A and B only in the evidence. Neither
  account may have a payment method or valuable inventory. Never type authentication
  information anywhere except Steam's page on the test device.
- Use a stable network and allow enough time for Steam, AMO, and CSFloat to respond.
  A third-party outage is an incomplete run, not a pass.
- The expected pinned components are GeckoView `153.0.20260810162159` and the official
  signed CSFloat `5.17.0`, ID `{194d0dc6-7ada-41c6-88b8-95d7636fe43c}`, from
  `https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi`.
  The XPI SHA-256 is
  `70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D`.
- If a safe page with observable injection/tracking is unavailable, mark the required
  proof INCOMPLETE. Use an existing test inventory or trade page; never purchase,
  create, accept, or modify a trade for this test.
- Do not run against a valuable account. Do not intentionally create, accept, or
  modify a trade. Observe tracking/status only with harmless test-account data.

## Recorded human result

The user and upstream maintainer Dagkan report that the exact released candidate
completed the full authenticated two-account guide with two safe Steam test accounts.
On the Samsung Galaxy S25 Ultra running Android 16, at approximately
2026-09-05 15:15 CEST, GV-01 through GV-16 all passed. A/B activity recreation,
screen close/reopen, worker stop/reopen, full app restart, and disable/uninstall plus
restore all passed. Real Steam authentication, official CSFloat injection, the
official action, and a genuine observable tracking/status update passed. Neither
login nor Steam Guard was required after initial authentication, and no failed step
or failure message was reported.

The same complete authenticated two-account guide was reported PASS on the dedicated
Android Studio emulator `Codex_GeckoView_Campaign_API_36` / `emulator-5580` /
Android 16 API 36 x86_64. No more precise emulator timestamp, screenshots, or logs
were supplied with this human attestation. The security warning and evidence-sharing
restrictions below continue to apply.

The live issue has a
[GO comment](https://github.com/D4gkan/Steam-Account-Manager-App/issues/7#issuecomment-5557925973)
and is closed with maintainer permission relayed in the task. Medium tester and fresh
xhigh reviewer passes at exact checkpoint `062da23` complete the review basis; the
xhigh reviewer acknowledged `GO` with no blockers. ADR-0001 records the selected
architecture. Production #8 is released after the final documentation commit is
synchronized to the public repository.

## Steps

After explicit release, use this procedure on the dedicated emulator and the
supported physical device. Codex handles technical evidence; the user records only
observations. Do not infer one target's result from the other.

Every switch, recreation, and reopen initially loads the synthetic fixture, not the
previous authenticated page. Perform the nested live checks below before assigning
PASS. Do not infer live browser or extension storage from fixed markers. If required
live state or tracking/alarm behavior cannot be observed safely, mark it INCOMPLETE;
never provide identifying authentication screenshots.

1. Wait for Codex to explicitly release the device gate and supply the verified APK.

   Expected: Independent validation is accepted and the supplied APK matches the receipt; otherwise stop.

2. Install the supplied debug APK on your own approved test device.

   Expected: Android installs the debug app successfully.

3. Clear only this debug app's storage in Android Settings.

   Expected: The debug app starts clean; no other app or device data changes.

4. Open **Gecko profile isolation prototype**.

   Expected: The router shows fixed ready, A/B selection, reopen, and worker-stop controls (GV-01).

5. Open synthetic slot A.

   Expected: A's engine marker includes nav=A-history; pinned engine and extension metadata are visible.

6. Select **Open public Steam listing**.

   Expected: The public listing loads inside GeckoView.

7. Select **Review and install CSFloat**.

   Expected: The consent prompt identifies official CSFloat and all required permissions, including Steam API host access (GV-05).

8. Choose **Deny**.

   Expected: A remains CSFloat-absent with a safe explanation and retry available (GV-06).

9. Select **Reinstall CSFloat with consent**.

   Expected: The complete consent prompt appears again.

10. Choose **Accept**.

   Expected: Official signed CSFloat 5.17.0 becomes enabled only for A; no separate optional-runtime permission is claimed (GV-02, GV-07).

11. Sign in to Steam test account A inside the Steam page.

   Expected: Normal authentication and Steam Guard complete without app interception or credential logging (GV-03).

12. Open a harmless existing test inventory or trade page.

   Expected: Recognizable CSFloat injection appears inside GeckoView (GV-04).

13. Select **Open official CSFloat action**.

   Expected: The real official popup opens, not an app-made substitute.

14. Inspect the official popup's permission-derived state.

   Expected: With required Steam permission granted, the official Firefox popup displays the disabled “Offer Tracking Enabled” label; do not try to tap it. This label alone does not prove tracking activity. GV-08 still requires a genuine authenticated, observable CSFloat tracking/status update; unavailable proof is INCOMPLETE. Do not create, accept, or modify trades.

15. Close the popup.

   Expected: The selected A page remains visible.

16. Select **Record visible official status**.

   Expected: The app records the observed popup state only. This app-recorded status is not GV-08 proof by itself and does not replace the required authenticated CSFloat tracking/status update.

17. Return to the router.

   Expected: The A worker screen closes safely.

18. Open synthetic slot B.

   Expected: B shows distinct fixed synthetic markers and CSFloat is absent. This fixture does not show Steam identity.

   1. Select **Open public Steam listing**.

      Expected: B is not authenticated as A before B's independent installation or login.

19. Select **Review and install CSFloat** in B.

   Expected: B shows its own complete permission prompt.

20. Choose **Accept** in B.

   Expected: CSFloat becomes enabled only after B's independent consent.

21. Sign in to Steam test account B inside the Steam page.

   Expected: B authenticates normally without any A identity.

22. Open a harmless existing B test inventory or trade page.

   Expected: CSFloat injection is visible for B.

23. Select **Open official CSFloat action** in B.

   Expected: The official popup belongs to B.

24. Inspect B's official popup's permission-derived state.

   Expected: The disabled “Offer Tracking Enabled” label reflects B's required Steam permission, not proof of live tracking. Separately require a genuine authenticated CSFloat tracking/status update for B without revealing A; unavailable proof is INCOMPLETE (GV-08, GV-11).

   1. Close the popup.

      Expected: B's page remains visible before switching.

25. Open slot A through the router.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected A page remains visible.


26. Open slot B through the router.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


27. Open slot A through the router.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected A page remains visible.


28. Open slot B through the router.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


29. Open slot A through the router.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected A page remains visible.


30. Select **Disable CSFloat** in A.

   Expected: A reports CSFloat disabled. Verify revocation on a real page and unavailable action below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: CSFloat injection is absent after revocation. Do not create or modify trades or make purchases.

   3. Inspect the disabled/unavailable **Open official CSFloat action** control.

      Expected: Access remains unavailable; do not attempt to open an inactive popup. Tracking must not be reported active.


31. Open B through the router.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


32. Return to A through the router.

   Expected: A's fixture returns and CSFloat remains disabled.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: CSFloat injection is absent after revocation. Do not create or modify trades or make purchases.

   3. Inspect the disabled/unavailable **Open official CSFloat action** control.

      Expected: Access remains unavailable; do not attempt to open an inactive popup. Tracking must not be reported active.


33. Select **Enable CSFloat**.

   Expected: Only A regains access; B is unchanged.

34. Open A's harmless existing test inventory or trade page.

   Expected: A's injection is restored.

35. Open A's official CSFloat action.

   Expected: A's official tracking-capable state is restored (GV-14).

   1. Close the popup.

      Expected: A's page is visible before uninstall.

36. Select **Uninstall CSFloat** in A.

   Expected: A reports CSFloat absent. Verify removal on a real page and unavailable action below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: CSFloat injection is absent after revocation. Do not create or modify trades or make purchases.

   3. Inspect the disabled/unavailable **Open official CSFloat action** control.

      Expected: Access remains unavailable; do not attempt to open an inactive popup. Tracking must not be reported active.


37. Open B through the router.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


38. Return to A through the router.

   Expected: A's fixture returns and CSFloat remains absent.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: CSFloat injection is absent after revocation. Do not create or modify trades or make purchases.

   3. Inspect the disabled/unavailable **Open official CSFloat action** control.

      Expected: Access remains unavailable; do not attempt to open an inactive popup. Tracking must not be reported active.


39. Select **Reinstall CSFloat with consent**.

   Expected: Full consent is requested again.

40. Choose **Deny**.

   Expected: A stays absent.

41. Select **Reinstall CSFloat with consent** again.

   Expected: Full consent is repeated on retry.

42. Choose **Accept**.

   Expected: A's installation is restored (GV-14). Uninstall is not required to preserve tracking storage; establish a new tracking baseline before lifecycle checks.

   1. Select **Open public Steam listing**.

      Expected: A's correct authentication is visible.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A.

   3. Select **Open official CSFloat action**.

      Expected: A's official popup opens.

   4. Inspect the official popup's permission-derived state.

      Expected: The disabled “Offer Tracking Enabled” label confirms required Steam permission only. Re-establish the live baseline through a genuine authenticated, observable CSFloat tracking/status update before lifecycle checks; unavailable proof is INCOMPLETE. Do not perform trade operations.

   5. Close the popup.

      Expected: A's page remains visible.

   6. Select **Record visible official status**.

      Expected: The app records the status just observed, not an inferred tracking state.

43. Rotate the device with A selected.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected A page remains visible.


44. Select **Close worker screen**.

   Expected: The router appears without a crash.

45. Select **Reopen selected slot**.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected A page remains visible.


46. Return to the router.

   Expected: The selected slot remains A.

47. Select **Stop worker process**.

   Expected: GV-WORKER-STOPPED appears without a timeout.

48. Select **Reopen selected slot**.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected A page remains visible.


49. Fully stop the debug app in Android Settings.

   Expected: The app stops without clearing its data.

50. Launch **Gecko profile isolation prototype**.

   Expected: The router still selects A.

51. Select **Reopen selected slot**.

   Expected: The A fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe A's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for A. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows A's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Observe an official post-restart tracking/status update.

      Expected: An observable official update supports GV-10 background/tracking behavior. A saved toggle or app badge alone is insufficient. If no update is observable, mark this proof INCOMPLETE; do not invent a timing deadline or force a trade.

   5. Close the popup.

      Expected: The selected A page remains visible.


52. Open B through the router.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


53. Rotate the device with B selected.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


54. Select **Close worker screen**.

   Expected: The router appears without a crash.

55. Select **Reopen selected slot**.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


56. Return to the router.

   Expected: B remains selected.

57. Select **Stop worker process**.

   Expected: GV-WORKER-STOPPED appears without timeout.

58. Select **Reopen selected slot**.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Close the popup.

      Expected: The selected B page remains visible.


59. Fully stop the debug app in Android Settings.

   Expected: The app stops without clearing its data.

60. Launch **Gecko profile isolation prototype**.

   Expected: B remains selected.

61. Select **Reopen selected slot**.

   Expected: The B fixture and correct extension access metadata return without a crash, cross-slot marker, timeout, or duplicate consent. Verify live state separately below.

   1. Select **Open public Steam listing**.

      Expected: Observe B's own Steam authentication, never the other account. Record any reauthentication requirement; fixture markers alone prove no live identity.

   2. Open a harmless existing test inventory or trade page.

      Expected: Real CSFloat injection is visible for B. Do not create or modify trades or make purchases.

   3. Select **Open official CSFloat action**.

      Expected: The official popup shows B's expected prior tracking/access state. An app-recorded status or synthetic marker is not a substitute.

   4. Observe an official post-restart tracking/status update.

      Expected: An observable official update supports GV-10 background/tracking behavior. A saved toggle or app badge alone is insufficient. If no update is observable, mark this proof INCOMPLETE; do not invent a timing deadline or force a trade.

   5. Close the popup.

      Expected: The selected B page remains visible.


62. Follow an allowed Steam authentication redirect or link.

   Expected: It remains in-app; check any flow relying on window.opener, postMessage or window.close explicitly.

63. Select **Test blocked navigation**.

   Expected: The unrelated destination is not loaded; a fixed redacted message offers Stay here and explicit external opening.

64. Choose **Stay here**.

   Expected: The current allowed page remains in the embedded browser.

65. Select **Test blocked navigation** again.

   Expected: The same redacted offer returns without auto-opening anything.

66. Choose **Open in external browser**.

   Expected: Only this explicit choice opens the unrelated destination externally (GV-15).

67. Select **Test unavailable external handoff** after returning to the prototype.

   Expected: The fixed blocked-state choice is shown.

68. Choose **Open in external browser**.

   Expected: GV-EXTERNAL-HANDOFF-UNAVAILABLE appears with recoverable stay behavior and no destination details.

69. Select **Open synthetic isolation marker**.

   Expected: The selected slot's base fixture loads.

   1. Select **Test allowed navigation**.

      Expected: The distinct allowed fixture page loads.

70. Select **Back**.

   Expected: The previous allowed fixture page returns without crossing slots.

71. Select **Forward**.

   Expected: The next allowed fixture page returns.

72. Select **Reload**.

   Expected: The same allowed fixture page reloads correctly.

73. Activate **Open allowed fixture window**.

   Expected: The allowed target loads in the selected session: this prototype is single-window, not proof of opener/postMessage/window.close semantics.

74. Activate **Open blocked fixture window**.

   Expected: The denied new-window target remains blocked with explicit external choice (GV-15).

75. Select **Open public Steam listing**.

   Expected: The selected slot has a real Steam-page context before opening the official popup.

   1. Select **Open official CSFloat action**.

      Expected: The enabled selected slot's official popup opens.

   2. Close the popup.

      Expected: The action state is ready; **Simulate popup failure (test only)** is available. If not, mark the precondition INCOMPLETE, not a simulated failure pass.

   3. Select **Simulate popup failure (test only)**.

      Expected: A fixed non-sensitive popup failure is visible, tracking is not falsely active, and **Recover and rediscover CSFloat** becomes available.

76. Choose **Open public Steam listing in external browser** while the recovery error is visible.

   Expected: Only this tap opens the fixed public listing externally, without copying the embedded login URL, cookies, or session state. The external browser has its own authentication state; this is not proof of CSFloat tracking there.

77. Return to the prototype using Android Back.

   Expected: The selected slot remains isolated and its recovery controls remain available.

78. Select **Recover and rediscover CSFloat**.

   Expected: A fresh query restores the ready action state for the enabled official extension; the earlier error was not already recovered before this click.

   1. Record any naturally occurring network/load failure.

      Expected: Recovery remains actionable and safe; if none occurs mark this observation NOT RUN, not a fabricated pass. Do not manufacture an outage.

## If it fails

Stop the current target's run and mark the affected GV row `FAIL` or `INCOMPLETE`.
Record the step number, target metadata, UTC time, visible fixed `GV-*` message, and
the last safe action. Do not retry more than twice for an apparent Steam, AMO, network,
Gradle, adb, or emulator transient; note what changed between retries. Recover by
closing the popup, returning to the router, and using the explicit reopen or recovery
control. If the wrong account appears, stop immediately, close the worker, and do not
continue until the run has been reviewed.

A `FAIL` in any required GV-01–GV-16 row produces `NO-GO`. Missing physical-device,
reviewer, maintainer, or official-issue evidence produces `INCOMPLETE`; it cannot be
treated as `GO`.

## Evidence to share

Codex supplies the exact commit/APK size/hash, pinned engine/official extension
metadata, emulator environment, automated results, and safe technical screenshots
or bounded logs. The user does not run shell commands or collect browser storage.

After phone-test release, fill in this device-only record (A/B labels only):

```text
Samsung model:
Android version / API (if known):
Test time:
GV-01:        GV-02:        GV-03:        GV-04:
GV-05:        GV-06:        GV-07:        GV-08:
GV-09:        GV-10:        GV-11:        GV-12:
GV-13:        GV-14:        GV-15:        GV-16:
Use PASS / FAIL / INCOMPLETE for each.
Activity recreation A:       B:
Screen close/reopen A:       B:
Worker stop/reopen A:        B:
Full app restart A:          B:
Reauthentication required (A/B, transition only):
Failed step and safe observed message:
```

Do not share passwords, Steam Guard codes, QR login screens, cookies, tokens, account names, trades, payment information, or unredacted authentication screenshots.

No identifying authentication screenshots are requested. Codex owns safe technical
capture; never export browser storage or full logcat. Maintainer/reviewer
acknowledgement and official issue #7 `GO` are separate required evidence, not a
user checklist shortcut. Phone observations cannot replace live emulator proof.

## What this test does not prove

- One emulator and one physical device do not prove behavior on every Android model,
  vendor image, network, or memory class.
- A short tracking observation does not prove long-running background reliability.
- Passing the prototype does not prove the later production UI, migration, upgrade,
  rollback, or final release build.
- Debug APK size and point-in-time memory readings are not release download size,
  installed size, battery, or performance guarantees.
- The result does not authorize a modified, repacked, forked, silently authorized, or
  substituted CSFloat package.
- This completed prototype gate does not replace the evidence required by production
  issues #8–#12. Production #8 is released only after the final gate documentation is
  committed and synchronized to the public repository.

# Issue #8 production Steam-login smoke test

## Accepted result

The exact `f203175c45c14ec764d0f43c4550dbbe137c95ec` APK and SHA-256 below passed an
approximately 15-minute run on a Samsung Galaxy S25 Ultra running Android 16. A/B
isolation, close/reopen persistence, phone-restart persistence, and public
avatar/profile detection passed, with no unexpected reauthentication. The report was
complete and contained no sensitive evidence. Issue #9 may proceed. The procedure is
retained below as the gate record.

## What changed

Selecting Steam for an account now opens the app's production GeckoView session.
Each `(account, website)` pair keeps its own persistent browser profile. Before any
Steam page loads, the app asks permission for its built-in public avatar/profile
detector. The old WebView path remains available for other sites and rollback.
CSFloat production installation is issue #10 and is not part of this focused test.

## Before you start

- Exact application source: `f203175c45c14ec764d0f43c4550dbbe137c95ec`.
- Use only the supplied `app-debug.apk`: 598,942,841 bytes; SHA-256
  `8432D12371C43153E62F64134AC5160E409ACCFD798B243DC847AB862618C912`.
- Do not reuse the issue #7 prototype APK. Install this APK as an update; do not
  uninstall the existing debug app first, because that would erase the migration
  state this test needs.
- Supported device: Android 9/API 28 or newer. The planned target is Samsung Galaxy
  S25 Ultra, Android 16, with enough free space for the approximately 599 MB APK.
- Use two dedicated Steam test accounts with no payment method and no valuable
  inventory. Call them A and B only; do not report their names.
- Enter Steam credentials and Steam Guard only on the phone. Do not send them to
  Codex, GitHub, Drive, Discord, or another person.
- **Cancel** or Android Back denies the profile detector, opens no Steam page, and
  stores no consent. The prompt appears again on the next attempt.
- Use a normal trusted network. Stop if Android reports a signature mismatch, the
  APK metadata differs, or the app is not the expected Steam Account Manager debug
  build.

## Steps

1. Download the supplied issue #8 APK to the Samsung phone.

   Expected: The download completes and names the issue #8 build, not the issue #7 prototype.

2. Install the APK as an update to the existing Steam Account Manager debug app.

   Expected: Android installs the update without requiring the previous app to be uninstalled.

3. Open Steam Account Manager.

   Expected: The existing safe test accounts and website entries are still present.

4. Select test account A.

   Expected: Account A's website list opens without exposing another account's information.

5. Open Steam for account A.

   Expected: **Allow Steam profile detection?** appears before any Steam page. It
   names only `steamcommunity.com` and `www.steamcommunity.com`, visible public
   avatar/profile links, the private connection back to this app, and the possible
   one-time sign-in caused by the WebView migration.

6. Press **Cancel** on that message.

   Expected: The browser closes without loading a Steam page or granting detector consent.

7. Open Steam for account A again.

   Expected: **Allow Steam profile detection?** appears again before any Steam page.

8. Press Android Back once.

   Expected: The browser closes without loading a Steam page or granting detector consent.

9. Open Steam for account A again.

   Expected: **Allow Steam profile detection?** appears for a third time before any Steam page.

10. Press **Allow and continue** on that message.

   Expected: Steam opens inside the app only after consent, and the message does not
   claim that old login data was migrated.

11. Sign in to Steam account A on the phone.

   Expected: Steam accepts the safe account's normal authentication flow; all secrets remain on the phone.

12. Confirm that Steam shows account A's signed-in page.

   Expected: The visible identity is A and browsing remains inside the app on allowed Steam pages.

13. Close the in-app browser with its **Close** button.

   Expected: The account screen returns and stays usable.

14. Open Steam for account A again.

    Expected: Account A is still signed in; no second login or Steam Guard challenge is needed unless Steam itself expired the session.

15. Close the in-app browser.

    Expected: The account screen returns normally.

16. Select test account B.

    Expected: Account B's website list opens.

17. Open Steam for account B.

    Expected: B's separate **Allow Steam profile detection?** message appears before
    any Steam page; no account A authenticated page is visible.

18. Press **Allow and continue** on B's message.

    Expected: Steam opens for B without showing account A's authenticated identity or A's signed-in page.

19. Sign in to Steam account B on the phone.

    Expected: Steam signs in as B without changing A's session.

20. Close the in-app browser.

    Expected: The account screen returns normally.

21. Open Steam for account A.

    Expected: The session returns to signed-in account A, never B.

22. Close the in-app browser.

    Expected: The account screen returns and shows account A's correct current Steam avatar/profile metadata. Mark the run `FAIL` if it is absent, remains a placeholder, or belongs to B.

23. Open Steam for account B.

    Expected: The session returns to signed-in account B, never A.

24. Restart the Samsung phone using Android's power menu.

    Expected: The phone shuts down and boots to its lock screen without uninstalling the app or clearing its data.

25. Unlock the phone.

    Expected: Android returns to the normal home screen.

26. Reopen Steam Account Manager.

    Expected: The app returns to its normal account screen and remains responsive.

27. Select test account A.

    Expected: Account A's website list opens.

28. Open Steam for account A.

    Expected: A's correct isolated session is restored and the app remains responsive.

29. Report only the core result to the user.

    Expected: Report `ISSUE #8 PASS` or `ISSUE #8 FAIL`, Samsung Galaxy S25 Ultra,
    Android 16, approximate test time, whether A stayed A and B stayed B, whether
    close/reopen and phone restart preserved sessions, and whether avatar/profile detection
    worked. Do not include account names or authentication evidence.

## If it fails

Stop at the failed step. Close the in-app browser and then the app; do not repeatedly
submit credentials. Record the step number, `PASS` or `FAIL`, approximate time,
phone model, Android version, and the exact short error text. If A ever appears in
B or B appears in A, sign out of both test accounts, stop testing, and report an
isolation failure. Do not uninstall or clear data unless Codex supplies a new
recovery procedure.

## Evidence to share

Share only `PASS` or `FAIL`, the APK commit/checksum confirmation, Samsung Galaxy S25
Ultra and Android 16, approximate test time, the A/B isolation result, the
close/reopen and phone-restart result, and whether public avatar/profile detection
worked. A redacted screenshot is optional and must not show authentication or
account-specific content.

Do not share passwords, Steam Guard codes, QR login screens, cookies, tokens, account names, trades, payment information, or unredacted authentication screenshots.

## What this test does not prove

- One Samsung phone and one network do not represent every supported Android device,
  vendor image, carrier, memory pressure condition, or Steam outage.
- This focused smoke test does not install or validate production CSFloat; that is
  issue #10.
- A successful session does not prove every Steam authentication method, external
  provider, popup, or future Steam page change.
- The debug APK is not a signed release artifact and does not prove release signing,
  Play distribution, download size, battery use, or long-term performance.
- This result covers one exact Samsung/Android/build combination; issue #9 has its
  own machine and emulator acceptance requirements.

# Issue #12 final supported-device acceptance

## What changed

This section will test the final production cutover after issues #8–#12 have passed
their preceding gates and machine verification. No final APK exists yet.

## Before you start

Do not run this gate yet. The exact final commit, release-path test APK, size, SHA-256,
supported-device matrix, and safe-account requirements will replace this paragraph
after issue #12 machine verification.

## Steps

1. Wait for this section to name the exact final APK, checksum, and supported-device
   matrix.

   Expected: No final acceptance run is performed against a placeholder or stale APK.

## If it fails

Do not improvise a build or copy results from an earlier gate. Report that the guide
is incomplete for issue #12 so the Draft PR remains unready.

## Evidence to share

When this section is activated, share only the requested `PASS`/`FAIL`, exact build
metadata, Android/device information, and redacted screenshots or bounded logs.

Do not share passwords, Steam Guard codes, QR login screens, cookies, tokens, account names, trades, payment information, or unredacted authentication screenshots.

## What this test does not prove

Until the exact final procedure is committed, this placeholder proves nothing and the
Draft PR must not be marked ready for upstream review.

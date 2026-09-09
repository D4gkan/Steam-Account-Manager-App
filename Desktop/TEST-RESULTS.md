# Test results — 7 September 2026

Environment: Windows 11 build 26200, x64. Node 25.2.1 was used for development. Packaged Electron is 44.2.0; external Chromium is 153.0.8010.12, Playwright revision 1243. No claims here apply to Linux.

| Check | Result | Evidence scope |
|---|---|---|
| TypeScript checks | Passed | Main, preload and renderer |
| Unit tests | 33 passed | Selection, tab matching, Steam adapter validation, local bridge authentication, fetch/IP boundaries, PNG/ICO decoding, extension references/integrity |
| SQLite integration | Passed | Exact eleven seeds, first-three order, deleted entries not reseeded, invalid reorder rollback, string SteamID64, custom labels, duplicate identities |
| Development Electron smoke | Passed | Real window, sandboxed preload IPC, SQLite catalog and selection |
| Two-profile lifecycle | Passed | Actual manager process exit/restart, browsers survived, native reconnection, isolated fixture cookies, persisted cookies after browser restart, no page reload on reuse |
| Browser tab integration | Passed | Actual Chromium tab APIs, pinned ordering, cross-window reuse, unsaved form state |
| Steam content script fixtures | Passed | Actual content script with synthetic Steam own-profile and other-profile markup; no live login |
| Eight required extensions | Loaded/enabled | Exact IDs and versions observed through chrome.management; authenticated functionality not verified |
| Packaged Windows smoke | Passed | Packaged executable, SQLite, bundled Chromium/native host, all eight IDs, launch, Electron process exit/reconnect, session-only selection reset |
| Windows NSIS package | Installed successfully | Silent fresh installation returned exit code 0; Start menu shortcut created; installed copy passed the full packaged smoke test |
| Dependency audit | 0 reported vulnerabilities | npm audit after upgrades; not a guarantee of security |
| Linux native host | Generated only | ELF output produced; not executed |
| Linux AppImage | Failed | Windows symlink creation returned EPERM; Linux desktop/runtime behavior untested |

The browser lifecycle tests use temporary local HTTP fixtures, not real authentication cookies. The tab/identity fixture test uses a Playwright-owned test context solely for diagnostic control; production browser launches use detached child processes.

Real Steam login/Steam Guard, live identity detection, and each third-party extension's authenticated behavior require manual user validation. No trades, purchases, wagers or VPN activations were performed.

Development UI captures are under artifacts/ for layout review. They are not a browser-monitoring feature. Temporary test profiles and unused failed build staging may remain on disk; none are bundled as account data.


Installer: Steam Account Manager App-Setup-0.2.0.exe (333,672,081 bytes). SHA-256: 6C433F61B51FF0EB0627C1C658A2BD260D41BF96575CEB6FE8E5D5736EC4FF0C.
Installed application: APP/release/installed/Steam Account Manager App.exe. The installed application was exercised with isolated temporary user data, then closed normally; its proof browser was closed through the authenticated bridge.


## 0.2.1 startup visibility fix
Reproduced a running manager with no visible window after a hidden Windows launch. The dashboard now explicitly shows after loading, and repeat EXE launches show an existing hidden window before focusing it. Passed an Electron regression test for hide/relaunch and a Windows Start-Process -WindowStyle Hidden test that checked a visible native window handle. No browser or account data model changes.

Installed the 0.2.1 update successfully and launched the installed executable with hidden Windows startup flags. Confirmed a visible native dashboard window titled Steam Account Manager App. The manager was left open for the user.

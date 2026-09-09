# Native messaging registration

`host.js` is compiled to `bin/sam-native.exe` (Windows) or `bin/sam-native` (Linux) using @yao-pkg/pkg with a bundled Node 22 runtime. No system Node is required. `host.bat` is historical development material and is not packaged.

The manager writes an app-specific native host manifest restricting `allowed_origins` to its pinned companion extension ID. Windows per-user registration is `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.steamaccountmanager.bridge`. This path has been exercised with Playwright Chromium revision 1243 on this Windows machine.

Linux account launches register `NativeMessagingHosts/com.steamaccountmanager.bridge.json` inside that account's `--user-data-dir`. Chromium resolves per-user native hosts relative to the selected browser data directory, so registering only under the default `~/.config/chromium` directory is insufficient. The legacy default registration is retained; each managed profile gets a refreshed manifest before launch. See [Chromium's lookup implementation](https://chromium.googlesource.com/chromium/src/+/HEAD/chrome/common/chrome_paths.cc) and the root README for current verification. No speculative native-host launch flag or global Chrome extension policy is used.

The browser receives the non-secret connection-info file path through its environment. The host checks the calling extension origin, reads the per-install secret, and authenticates to the local pipe/socket. The companion then presents a profile capability; the manager maps it to an existing managed account. Frames are bounded to 1 MiB, replies belong to their issuing socket, and arbitrary commands are rejected.

When the manager exits, its socket closes and the native host exits. Chromium remains independent. Companion alarms and reconnect timers reconnect when the manager returns. Per-profile companion versions and extension assets are immutable; updates apply on browser restart.

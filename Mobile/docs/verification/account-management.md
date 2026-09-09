# Account actions and drag ordering — 2026-09-09

Each home-screen account card has edit and delete buttons on the right. Editing
trims whitespace and rejects empty names. Deletion requires confirmation and
removes the local account entry and its dependent session metadata using the
existing repository deletion operation. This is not a browser-profile erasure flow.

Long-press the card or avatar to reorder. The list yields ordinary touch scrolling
while dragging and scrolls automatically near its edges. Stable account identities
and the latest pending order are used when saving. Reorder writes run in one Room
transaction, and new accounts append after the highest existing position even
when earlier accounts were deleted. Renaming updates only the display-name column.

The obsolete reorder library was removed; gesture handling and placement animation
now use the app's current Compose foundation APIs. No browser-engine or extension
package pins changed.

## Verification

- Debug APK and instrumentation APK built; all 74 JVM tests passed.
- Two real touch/accessibility tests passed on the Android 17 emulator: rename,
  drag across cards, recreation, delete cancellation and confirmed deletion; and
  dragging through a 16-account list with automatic scrolling.
- Five Room repository tests passed, including adding after deletion without tied
  positions and preserving account order.
- The earlier official CSFloat popup close/reopen regression also passed in the
  same final run: eight device tests total. The download/installation wait allows
  90 seconds because it includes the official network download.
- The updated debug APK was installed on the connected Samsung Galaxy S25 Ultra
  with `adb install -r`; MainActivity cold-launched successfully. No phone account
  was renamed, reordered or deleted by the automated tests, which ran only on the emulator.

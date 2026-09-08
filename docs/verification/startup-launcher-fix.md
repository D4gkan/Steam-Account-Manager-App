# Startup and launcher fix — 2026-09-08

## Reproduction

The connected Samsung Galaxy S25 Ultra (SM-S938B), running Android 16,
closed immediately when the home screen loaded saved accounts. Its crash log
identified `NoSuchMethodError` for `LazyItemScope.animateItemPlacement$default`,
called by `org.burnoutcrew.reorderable.ReorderableItem`. An empty installation
did not exercise this path.

## Changes

- Call the reorder library's core overload explicitly and supply the current
  Compose `Modifier.animateItem()` animation. This preserves drag handling while
  avoiding the library's binary call to the removed animation method.
- Remove the prototype router's MAIN/LAUNCHER intent filter from debug builds.
  The router remains available for explicit prototype verification launches.
- Use adaptive launcher icons with a transparent background and a scaled
  foreground, preserving the original PNG unchanged.

## Verification

- Debug APK assembled; all 74 JVM tests passed.
- Both `StartupTest` device tests passed on the Android 17 emulator: populated
  home launch/recreation and exactly one launcher activity.
- The first Compose/Espresso version of the smoke test encountered an unrelated
  Android 17 `InputManager.getInstance` incompatibility. The final smoke test
  uses platform drawing and activity lifecycle checks instead.
- Installed the updated debug APK on the Samsung with `adb install -r`.
  Cold launch succeeded; subsequent checks found the process alive and
  `MainActivity` resumed. No uninstall or data clearing was performed on the phone.
- The Samsung package manager reported exactly one MAIN/LAUNCHER activity,
  `MainActivity`.

The StrongBox hypothesis considered before obtaining the phone log was not the
reported cause; no encryption or credential-storage changes are included.

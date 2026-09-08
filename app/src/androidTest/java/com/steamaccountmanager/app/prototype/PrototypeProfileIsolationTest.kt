package com.steamaccountmanager.app.prototype

import android.accessibilityservice.AccessibilityService
import android.app.ActivityManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PrototypeProfileIsolationTest {
    private val instrumentation = InstrumentationRegistry.getInstrumentation()
    private val context = instrumentation.targetContext

    @Test
    fun publicSteamExternalRecoveryRemainsAvailableAfterSafeError() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        awaitEnabled("Open public Steam listing in external browser", true)
        assertTrue(instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() == context.packageName)

        click("Test unavailable external handoff")
        assertTrue(instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() == context.packageName)
        click("Open in external browser")
        awaitText("GV-EXTERNAL-HANDOFF-UNAVAILABLE: No external browser can open this destination. Stay here.")
        awaitEnabled("Open public Steam listing in external browser", true)
        assertTrue(instrumentation.uiAutomation.rootInActiveWindow?.packageName?.toString() == context.packageName)
        val resolved = android.os.ParcelFileDescriptor.AutoCloseInputStream(
            instrumentation.uiAutomation.executeShellCommand(
                "cmd package resolve-activity --brief -a android.intent.action.VIEW " +
                    "-c android.intent.category.BROWSABLE -d ${GeckoViewPrototypeActivity.STEAM_LISTING_URL}",
            ),
        ).bufferedReader().use { it.readText() }
        val browserPackage = resolved.lineSequence().map { it.trim() }
            .firstOrNull { it.matches(Regex("[A-Za-z0-9_.]+/[A-Za-z0-9_.$]+")) }?.substringBefore('/')
        assertTrue("A concrete external browser must resolve the public fixture", browserPackage != null && browserPackage != context.packageName && browserPackage != "android")
        click("Open public Steam listing in external browser")
        val deadline = SystemClock.uptimeMillis() + 10_000
        var resumedPackage: String? = null
        while (SystemClock.uptimeMillis() < deadline) {
            resumedPackage = topResumedActivityPackage()
            if (resumedPackage == browserPackage) break
            SystemClock.sleep(200)
        }
        assertTrue(
            "Explicit recovery must top-resume the resolved browser; observed=$resumedPackage",
            resumedPackage == browserPackage,
        )
        fun launchRouter(): String? {
            val output = android.os.ParcelFileDescriptor.AutoCloseInputStream(
                instrumentation.uiAutomation.executeShellCommand(
                    "am start -W --user 0 -f 0x14000000 -n ${router.flattenToString()}",
                ),
            ).bufferedReader().use { it.readText() }
            return output.lineSequence().firstOrNull { it.startsWith("Status:") }
        }
        var launchStatus = launchRouter()
        val returnDeadline = SystemClock.uptimeMillis() + 10_000
        var returnedPackage: String? = null
        var nextLaunchAt = SystemClock.uptimeMillis() + 2_000
        while (SystemClock.uptimeMillis() < returnDeadline) {
            returnedPackage = topResumedActivityPackage()
            if (returnedPackage == context.packageName) break
            if (SystemClock.uptimeMillis() >= nextLaunchAt) {
                launchStatus = launchRouter()
                nextLaunchAt = SystemClock.uptimeMillis() + 2_000
            }
            SystemClock.sleep(200)
        }
        assertTrue(
            "Router cleanup launch failed; status=$launchStatus observed=$returnedPackage",
            launchStatus == "Status: ok" && returnedPackage == context.packageName,
        )
        awaitText("Reopen selected slot")
    }

    @Test
    fun navigationGateExposesControlsAndBlocksWithoutAutomaticHandoff() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)

        awaitText("Back")
        awaitText("Forward")
        awaitText("Reload")
        click("Test allowed navigation")
        awaitText("GV-NAVIGATION-TEST-READY", 30_000)
        awaitEnabled("Back", true)
        click("Back")
        awaitText("GV7-NAV-BASE")
        awaitEnabled("Forward", true)
        click("Forward")
        awaitText("GV7-NAV-NEXT")
        awaitEnabled("Forward", false)
        click("Reload")
        awaitText("GV-NAVIGATION-RELOADED")
        clickDescription("Open allowed fixture window")
        awaitText("GV-NAVIGATION-SAME-WINDOW")
        awaitText("GV7-NAV-BASE")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history")
        awaitText("GV-ACTION-UNAVAILABLE")
        awaitEnabled("Back", true)
        clickDescription("Open blocked fixture window")
        awaitText("GV-NAVIGATION-BLOCKED: Destination blocked. Stay here or open it in your external browser.")
        awaitText("Stay here")
        awaitText("Open in external browser")
        click("Test unavailable external handoff")
        click("Open in external browser")
        awaitText("GV-EXTERNAL-HANDOFF-UNAVAILABLE: No external browser can open this destination. Stay here.")
    }

    @Test
    fun routerRecreationDuringPendingSwitchFinishesCleanupWithoutStaleAuthorization() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)

        backToRouter()
        click("Open synthetic slot B")
        click("Recreate router activity")

        awaitText("GV-ROUTER-READY")
        awaitText("selected=A")
        click("Reopen selected slot")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        repeat(4) {
            SystemClock.sleep(500)
            click("Recreate worker activity")
            SystemClock.sleep(500)
            awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 10_000)
        }
        backToRouter()
        click("Stop worker process")
        if (awaitAny("GV-WORKER-STOPPED", "GV-WORKER-STOP-TIMEOUT") == 1) {
            throw AssertionError("Worker stop timed out with ${appChildProcesses()}")
        }
        awaitNoAppChildProcesses(10_000)
    }

    @Test
    fun markerReconnectsAcrossRepeatedWorkerActivityRecreation() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        repeat(4) {
            click("Uninstall issue6 marker")
            awaitText("GV-MARKER-STATE-ABSENT slot=A", 30_000)
            click("Recreate worker activity")
            SystemClock.sleep(500)
            awaitText("GV-MARKER-STATE-ABSENT slot=A", 10_000)
            click("Reinstall issue6 marker (synthetic only)")
            awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
            awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 10_000)
        }

        backToRouter()
        click("Stop worker process")
        if (awaitAny("GV-WORKER-STOPPED", "GV-WORKER-STOP-TIMEOUT") == 1) {
            throw AssertionError("Worker stop timed out with ${appChildProcesses()}")
        }
        awaitNoAppChildProcesses(10_000)
    }

    @Test
    fun explicitStopSupersedesPendingCrossProfileSelection() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)

        backToRouter()
        click("Open synthetic slot B")
        click("Stop worker process")

        awaitText("GV-WORKER-STOPPED", 30_000)
        SystemClock.sleep(4_000)
        assertFalse(appChildProcessRunning())
    }

    @Test
    fun reopenDuringExplicitStopWaitsForDeathThenRestoresSelectedProfile() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot B")
        awaitText("GV6|slot=B|cookie=B|local=B|idb=B|nav=B-history", 45_000)

        backToRouter()
        click("Stop worker process")
        click("Reopen selected slot")

        SystemClock.sleep(3_000)
        awaitText("GV6|slot=B|cookie=B|local=B|idb=B|nav=B-history", 30_000)
        backToRouter()
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
    }

    @Test
    fun latestReopenWinsWhileCrossProfileShutdownIsPending() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)

        backToRouter()
        click("Open synthetic slot B")
        click("Reopen selected slot")

        SystemClock.sleep(3_000)
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 20_000)
        backToRouter()
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
    }

    @Test
    fun alreadyEnabledMarkerOperationsProduceFreshResults() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        click("Enable issue6 marker")
        awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        click("Reinstall issue6 marker (synthetic only)")
        awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
    }

    @Test
    fun interruptedMarkerRestartCompletesBeforeWorkerShutdown() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        repeat(3) {
            backToRouter()
            click("Reopen selected slot")
            click("Close worker screen")
            awaitText("Reopen selected slot")
            click("Stop worker process")
            awaitText("GV-WORKER-STOPPED", 30_000)
            awaitNoAppChildProcesses(10_000)
            click("Reopen selected slot")
            awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
            awaitText("version=1.5", 30_000)
            awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        }
    }

    @Test
    fun explicitMarkerDisablePersistsAfterInterruptedReopen() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        ensureMarkerEnabled("A")
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        backToRouter()
        click("Reopen selected slot")
        click("Close worker screen")
        awaitText("Reopen selected slot")
        click("Reopen selected slot")
        awaitEnabled("Disable issue6 marker", true)
        click("Disable issue6 marker")
        awaitText("GV-MARKER-STATE-DISABLED slot=A", 30_000)
        backToRouter()
        click("Reopen selected slot")
        awaitText("GV-MARKER-STATE-DISABLED slot=A", 30_000)
        backToRouter()
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Reopen selected slot")
        awaitText("GV-MARKER-STATE-DISABLED slot=A", 30_000)
    }

    @Test
    fun markerRemainsEnabledAfterInterruptedScreenReopens() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        backToRouter()
        repeat(8) {
            click("Reopen selected slot")
            click("Close worker screen")
            awaitText("Reopen selected slot")
        }
        click("Reopen selected slot")
        awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
    }

    @Test
    fun markerReconnectsAcrossRepeatedScreenReopen() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        repeat(8) {
            backToRouter()
            click("Reopen selected slot")
            awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 30_000)
            awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
            awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        }
    }

    @Test
    fun markerUninstallRemainsAbsentAfterWorkerStopAndReopen() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        click("Uninstall issue6 marker")
        awaitText("GV-MARKER-STATE-ABSENT slot=A", 30_000)

        backToRouter()
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Reopen selected slot")
        awaitText("GV-MARKER-STATE-ABSENT slot=A", 45_000)
        awaitText("GV-MARKER-WAIT slot=A")
        assertTrue(instrumentation.uiAutomation.rootInActiveWindow
            ?.findAccessibilityNodeInfosByText("GV-MARKER-RESULT slot=A")?.isEmpty() == true)
    }

    @Test
    fun markerReinstallAfterWorkerStopAndReopenProducesFreshResult() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        click("Uninstall issue6 marker")
        awaitText("GV-MARKER-STATE-ABSENT slot=A", 30_000)

        backToRouter()
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        awaitNoAppChildProcesses(10_000)
        click("Reopen selected slot")
        awaitText("GV-MARKER-STATE-ABSENT slot=A", 45_000)
        awaitText("GV-MARKER-WAIT slot=A")
        assertTrue(instrumentation.uiAutomation.rootInActiveWindow
            ?.findAccessibilityNodeInfosByText("GV-MARKER-RESULT slot=A")?.isEmpty() == true)
        click("Reinstall issue6 marker (synthetic only)")
        awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
    }

    @Test
    fun syntheticSlotsRestoreEngineAndExtensionMarkersAcrossRealWorkerLifecycles() {
        val router = ComponentName(context, GeckoPrototypeRouterActivity::class.java)
        val worker = ComponentName(context, GeckoViewPrototypeActivity::class.java)
        assertTrue(context.packageManager.getActivityInfo(router, 0).exported)
        assertFalse(context.packageManager.getActivityInfo(worker, 0).exported)

        context.startActivity(
            Intent().setComponent(router).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP),
        )
        awaitText("Reopen selected slot")
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 30_000)
        ensureMarkerEnabled("A")
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
        awaitText("GV-MARKER-STATE-ENABLED slot=A")

        instrumentation.uiAutomation.rootInActiveWindow?.performAction(AccessibilityNodeInfo.ACTION_SCROLL_FORWARD)
        click("Recreate worker activity")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        backToRouter()
        click("Reopen selected slot")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 30_000)
        awaitText("version=1.5", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        click("Disable issue6 marker")
        awaitText("GV-MARKER-STATE-DISABLED slot=A")

        backToRouter()
        click("Open synthetic slot B")
        awaitText("GV6|slot=B|cookie=B|local=B|idb=B|nav=B-history", 45_000)
        ensureMarkerEnabled("B")
        awaitText("GV-MARKER-RESULT slot=B prior=B current=B", 30_000)
        awaitText("GV-MARKER-STATE-ENABLED slot=B")

        backToRouter()
        click("Open synthetic slot A")
        awaitText("GV6|slot=A|cookie=A|local=A|idb=A|nav=A-history", 45_000)
        awaitText("GV-MARKER-STATE-DISABLED slot=A")
        click("Enable issue6 marker")
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        click("Uninstall issue6 marker")
        awaitText("GV-MARKER-STATE-ABSENT slot=A")

        backToRouter()
        click("Open synthetic slot B")
        awaitText("GV-MARKER-STATE-ENABLED slot=B", 45_000)
        awaitText("GV-MARKER-RESULT slot=B prior=B current=B", 30_000)

        backToRouter()
        click("Open synthetic slot A")
        awaitText("GV-MARKER-STATE-ABSENT slot=A", 45_000)
        click("Reinstall issue6 marker (synthetic only)")
        awaitText("GV-MARKER-STATE-ENABLED slot=A", 30_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)

        backToRouter()
        click("Stop worker process")
        awaitText("GV-WORKER-STOPPED", 30_000)
        click("Reopen selected slot")
        awaitText("GV-MARKER-STATE-ENABLED slot=A", 45_000)
        awaitText("GV-MARKER-RESULT slot=A prior=A current=A", 30_000)
    }

    private fun backToRouter() {
        instrumentation.uiAutomation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK)
        awaitText("Reopen selected slot")
    }

    private fun appChildProcessRunning(): Boolean {
        return appChildProcesses().isNotEmpty()
    }

    private fun topResumedActivityPackage(): String? {
        val output = android.os.ParcelFileDescriptor.AutoCloseInputStream(
            instrumentation.uiAutomation.executeShellCommand("dumpsys activity activities"),
        ).bufferedReader().use { it.readText() }
        val topResumedLine = output.lineSequence().firstOrNull { "topResumedActivity=" in it } ?: return null
        return Regex(" ([A-Za-z0-9_.]+)/[A-Za-z0-9_.$]+[} ]").find(topResumedLine)?.groupValues?.get(1)
    }

    private fun appChildProcesses(): List<String> {
        val prefix = "${context.packageName}:"
        return (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager)
            .runningAppProcesses.orEmpty().filter { it.processName.startsWith(prefix) }
            .map { "${it.pid}:${it.processName}" }
    }

    private fun awaitNoAppChildProcesses(timeoutMs: Long) {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        while (appChildProcessRunning() && SystemClock.uptimeMillis() < deadline) SystemClock.sleep(200)
        assertFalse(appChildProcessRunning())
    }

    private fun ensureMarkerEnabled(slot: String) {
        when (awaitAny("GV-MARKER-STATE-ENABLED slot=$slot", "GV-MARKER-STATE-DISABLED slot=$slot", "GV-MARKER-STATE-ABSENT slot=$slot")) {
            0 -> {
                click("Disable issue6 marker")
                awaitText("GV-MARKER-STATE-DISABLED slot=$slot", 30_000)
                click("Enable issue6 marker")
            }
            1 -> click("Enable issue6 marker")
            2 -> click("Reinstall issue6 marker (synthetic only)")
        }
        awaitText("GV-MARKER-STATE-ENABLED slot=$slot", 30_000)
    }

    private fun awaitAny(vararg texts: String): Int {
        val deadline = SystemClock.uptimeMillis() + 30_000
        do {
            texts.forEachIndexed { index, text ->
                if (instrumentation.uiAutomation.rootInActiveWindow
                        ?.findAccessibilityNodeInfosByText(text)?.isNotEmpty() == true
                ) return index
            }
            scroll(true)
            SystemClock.sleep(200)
        } while (SystemClock.uptimeMillis() < deadline)
        throw AssertionError("No fixed marker state became visible")
    }

    private fun click(text: String) {
        val node = awaitNode(text)
        assertTrue(node.performAction(AccessibilityNodeInfo.ACTION_CLICK))
    }

    private fun clickDescription(description: String) {
        fun findClickable(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
            node ?: return null
            if (node.isClickable && node.contentDescription?.toString() == description) return node
            repeat(node.childCount) { findClickable(node.getChild(it))?.let { found -> return found } }
            return null
        }
        val node = requireNotNull(findClickable(instrumentation.uiAutomation.rootInActiveWindow))
        assertTrue(node.performAction(AccessibilityNodeInfo.ACTION_CLICK))
    }

    private fun awaitText(text: String, timeoutMs: Long = 10_000) = awaitNode(text, timeoutMs)

    private fun awaitEnabled(text: String, enabled: Boolean, timeoutMs: Long = 10_000) {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        do {
            val node = instrumentation.uiAutomation.rootInActiveWindow
                ?.findAccessibilityNodeInfosByText(text)?.firstOrNull()
            if (node?.isEnabled == enabled) return
            scroll(false)
            SystemClock.sleep(200)
        } while (SystemClock.uptimeMillis() < deadline)
        throw AssertionError("Control $text did not become enabled=$enabled")
    }

    private fun awaitNode(text: String, timeoutMs: Long = 10_000): AccessibilityNodeInfo {
        val deadline = SystemClock.uptimeMillis() + timeoutMs
        repeat(12) { scroll(false) }
        do {
            val node = instrumentation.uiAutomation.rootInActiveWindow
                ?.findAccessibilityNodeInfosByText(text)?.firstOrNull()
            if (node != null) return node
            scroll(true)
            SystemClock.sleep(200)
        } while (SystemClock.uptimeMillis() < deadline)
        val visibleCodes = buildList {
            fun collect(node: AccessibilityNodeInfo?) {
                node ?: return
                node.text?.toString()?.takeIf { it.startsWith("GV-") || it.startsWith("GV6|") }?.let(::add)
                repeat(node.childCount) { collect(node.getChild(it)) }
            }
            collect(instrumentation.uiAutomation.rootInActiveWindow)
        }
        val failedRoot = instrumentation.uiAutomation.rootInActiveWindow
        val mainStack = android.os.Looper.getMainLooper().thread.stackTrace.take(20)
            .joinToString(" | ") { it.toString() }
        throw AssertionError("Fixed prototype marker was not visible: $text; visible=$visibleCodes; " +
            "rootNull=${failedRoot == null}; rootPackage=${failedRoot?.packageName}; rootClass=${failedRoot?.className}; mainStack=$mainStack")
    }

    private fun scroll(forward: Boolean) {
        fun scrollable(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
            node ?: return null
            if (node.isScrollable) return node
            repeat(node.childCount) { scrollable(node.getChild(it))?.let { found -> return found } }
            return null
        }
        scrollable(instrumentation.uiAutomation.rootInActiveWindow)?.performAction(
            if (forward) AccessibilityNodeInfo.ACTION_SCROLL_FORWARD else AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD,
        )
    }
}

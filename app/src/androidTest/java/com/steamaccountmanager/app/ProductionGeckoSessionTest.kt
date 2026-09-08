package com.steamaccountmanager.app

import android.accessibilityservice.AccessibilityService
import android.app.ActivityManager
import android.content.Context
import android.os.SystemClock
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.browser.BrowserProcessController
import com.steamaccountmanager.app.browser.BrowserExtensionPackages
import com.steamaccountmanager.app.domain.model.BuiltInWebsites
import com.steamaccountmanager.app.browser.GeckoProfileIdentity
import com.steamaccountmanager.app.browser.SteamLoginDetector
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import java.io.BufferedReader
import java.io.Closeable
import java.io.InputStreamReader
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.nio.charset.StandardCharsets
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ProductionGeckoSessionTest {

    @Test
    fun genericGeckoBrowserShellSkipsSteamFeaturesAndTraversesPolicyHistoryRecoveryAndClose() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val runMarker = UUID.randomUUID().toString().replace("-", "")
        val sessionId = SessionIdentifier("instrumentation-synthetic-shell-$runMarker", "custom_https")
        val server = LoopbackFixture(runMarker)

        try {
            stopBrowserWorker(context)
            server.start()
            BrowserProcessController.openWebsite(
                context = context,
                sessionId = sessionId,
                targetUrl = server.url("SHELL-A"),
                allowedDomains = listOf(LOOPBACK_HOST),
            )
            waitForText(automation, "PROD-GECKO|SHELL-A")
            assertFalse("Generic site showed Steam detector consent", hasExactText(automation, "Allow Steam profile detection?"))
            assertFalse("Generic site showed CSFloat controls", hasExactText(automation, "Install CSFloat"))

            clickText(automation, "Allowed page")
            waitForText(automation, "PROD-GECKO|SHELL-B")
            assertControlEnabled(automation, "Back", true)
            clickText(automation, "Back")
            waitForText(automation, "PROD-GECKO|SHELL-A")
            assertControlEnabled(automation, "Forward", true)
            clickText(automation, "Forward")
            waitForText(automation, "PROD-GECKO|SHELL-B")
            clickText(automation, "Refresh")
            waitForText(automation, "PROD-GECKO|SHELL-B")

            clickText(automation, "Authentication redirect")
            waitForText(automation, "PROD-GECKO|AUTH")

            clickText(automation, "Blocked web link")
            waitForText(automation, "Leaving this website")
            assertFalse("Blocked dialog disclosed its destination", hasExactText(automation, BLOCKED_URI))
            clickText(automation, "Stay here")
            waitForText(automation, "PROD-GECKO|AUTH")

            clickText(automation, "Blocked web link")
            waitForText(automation, "Leaving this website")
            clickText(automation, "Open externally")
            assertTrue("External handoff neither opened an activity nor reported unavailability", waitUntil(UI_TIMEOUT_MS) {
                automation.rootInActiveWindow?.packageName?.toString()?.let { it != context.packageName } == true ||
                    hasExactText(automation, "No browser is available to open this link.")
            })
            if (automation.rootInActiveWindow?.packageName?.toString() != context.packageName) {
                assertTrue("Android Back did not return from external handoff", automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK))
                waitForText(automation, "PROD-GECKO|AUTH")
            }

            clickText(automation, "Rejected non-web link")
            SystemClock.sleep(1_000)
            assertFalse("Rejected non-web navigation offered external handoff", hasExactText(automation, "Leaving this website"))
            assertEquals(
                "Rejected non-web navigation left the app",
                context.packageName,
                automation.rootInActiveWindow?.packageName?.toString(),
            )
            if (hasExactText(automation, REJECTED_NAVIGATION_MESSAGE)) {
                clickText(automation, "Try again")
                waitForText(automation, "PROD-GECKO|AUTH")
            } else {
                waitForText(automation, "PROD-GECKO|AUTH")
            }

            clickText(automation, "Recoverable failure")
            waitForText(automation, "This website could not be reached.")
            server.allowRecovery()
            clickText(automation, "Try again")
            waitForText(automation, "PROD-GECKO|RECOVERED")

            clickText(automation, "Close")
            waitForTextToDisappear(automation, "PROD-GECKO|RECOVERED")
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun productionGeckoSessionPersistsIsolatesStopsAndRoutesLatestRequest() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val accountA = SessionIdentifier("instrumentation-synthetic-a", "steam")
        val accountB = SessionIdentifier("instrumentation-synthetic-b", "steam")
        val runMarker = UUID.randomUUID().toString().replace("-", "")
        val server = LoopbackFixture(runMarker)

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, accountA, accountB)
            server.start()

            open(context, accountA, server.url("A"))
            val aMarker = marker("A", "A", "A", "A")
            waitForText(automation, "Allow Steam profile detection?")
            assertFalse("Synthetic page loaded before detector consent", hasExactText(automation, aMarker))
            clickText(automation, "Allow and continue")
            waitForText(automation, aMarker)
            assertOneBrowserWorker(context)
            val firstGeneration = browserProcesses(context).associate { it.pid to it.processName }

            clickText(automation, "Close")
            waitForTextToDisappear(automation, aMarker)
            open(context, accountA, server.url("A"))
            waitForText(automation, aMarker)
            assertOneBrowserWorker(context)

            open(context, accountB, server.url("B"))
            val bMarker = marker("B", "B", "B", "B")
            waitForText(automation, "Allow Steam profile detection?")
            assertFalse("Synthetic page loaded before detector consent", hasExactText(automation, bMarker))
            clickText(automation, "Allow and continue")
            waitForText(automation, bMarker)
            assertOneBrowserWorker(context)
            assertPriorGenerationGone(context, firstGeneration)

            open(context, accountA, server.url("A"))
            waitForText(automation, aMarker)
            assertOneBrowserWorker(context)

            stopBrowserWorker(context)
            assertTrue("Explicit graceful stop left an app-owned browser process", browserProcesses(context).isEmpty())
            open(context, accountA, server.url("A"))
            waitForText(automation, aMarker)
            assertOneBrowserWorker(context)

            val rapidA = async(Dispatchers.Default) { open(context, accountA, server.url("A")) }
            delay(10)
            val rapidB = async(Dispatchers.Default) { open(context, accountB, server.url("B")) }
            rapidA.await()
            rapidB.await()
            waitForText(automation, bMarker)
            assertFalse("Stale A surfaced after the rapid B request", hasExactText(automation, aMarker))
            assertOneBrowserWorker(context)
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun detectorBroadcastPersistsOnlySyntheticPublicProfileValues() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext.applicationContext
        val app = context as SteamAccountManagerApp
        val account = app.accountRepository.createAccount("Instrumentation synthetic detector account")
        val avatarUrl = "https://avatars.steamstatic.com/synthetic_public_avatar.jpg"
        val steamProfileId = "76561198000000000"

        try {
            val result = SteamLoginDetector.parseResult(
                """{"avatarUrl":"$avatarUrl","profileUrl":"https://steamcommunity.com/profiles/$steamProfileId"}""",
            ) ?: throw AssertionError("Safe synthetic detector result was rejected")
            SteamLoginDetector.sendResult(result, account.id, context)

            assertTrue("Timed out waiting for the async detector broadcast to persist", waitUntil(UI_TIMEOUT_MS) {
                runBlocking {
                    app.accountRepository.getAccount(account.id)?.let {
                        it.avatarUrl == avatarUrl && it.steamProfileId == steamProfileId
                    } == true
                }
            })
        } finally {
            app.accountRepository.getAccount(account.id)?.let { app.accountRepository.deleteAccount(it) }
        }
    }

    @Test
    fun steamContentScriptPersistsSyntheticProfileThroughSessionBridge() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val app = context as SteamAccountManagerApp
        val account = app.accountRepository.createAccount("Instrumentation synthetic bridge account")
        val sessionId = SessionIdentifier(account.id, "steam")

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionId)
            BrowserProcessController.openWebsite(
                context = context,
                sessionId = sessionId,
                targetUrl = "https://steamcommunity.com/id/sam-geckoview-synthetic-fixture?sam-synthetic-bridge=1",
                allowedDomains = listOf("steamcommunity.com"),
            )
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")

            assertTrue("Timed out waiting for the Steam content-script bridge", waitUntil(UI_TIMEOUT_MS) {
                runBlocking {
                    app.accountRepository.getAccount(account.id)?.let {
                        it.avatarUrl == SYNTHETIC_BRIDGE_AVATAR_URL &&
                            it.steamProfileId == SYNTHETIC_BRIDGE_PROFILE_ID
                    } == true
                }
            })
        } finally {
            stopBrowserWorker(context)
            app.accountRepository.getAccount(account.id)?.let { app.accountRepository.deleteAccount(it) }
        }
    }

    @Test
    fun denyingDetectorConsentDoesNotLoadOrPersistConsent() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val sessionId = SessionIdentifier("instrumentation-synthetic-denial", "steam")
        val server = LoopbackFixture(UUID.randomUUID().toString().replace("-", ""))
        val pageMarker = marker("DENY", "DENY", "DENY", "DENY")

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionId)
            server.start()

            open(context, sessionId, server.url("DENY"))
            waitForText(automation, "Allow Steam profile detection?")
            assertFalse("Synthetic page loaded before detector consent", hasExactText(automation, pageMarker))
            clickText(automation, "Allow and continue")
            waitForText(automation, pageMarker)
            stopBrowserWorker(context)

            clearSyntheticDetectorConsent(context, sessionId)
            open(context, sessionId, server.url("DENY"))
            waitForText(automation, "Allow Steam profile detection?")
            assertFalse("Previously installed detector activated before renewed consent", hasExactText(automation, pageMarker))
            assertNoGeckoChildren(context)
            clickText(automation, "Cancel")
            waitForTextToDisappear(automation, "Allow Steam profile detection?")
            assertFalse("Synthetic page appeared after detector consent was denied", hasExactText(automation, pageMarker))

            open(context, sessionId, server.url("DENY"))
            waitForText(automation, "Allow Steam profile detection?")
            assertFalse("Denied detector consent was incorrectly persisted", hasExactText(automation, pageMarker))
            assertTrue(
                "Android Back action was not accepted",
                automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK),
            )
            waitForTextToDisappear(automation, "Allow Steam profile detection?")
            assertFalse("Synthetic page appeared after detector consent was denied with Back", hasExactText(automation, pageMarker))

            open(context, sessionId, server.url("DENY"))
            waitForText(automation, "Allow Steam profile detection?")
            assertFalse("Back incorrectly persisted detector consent", hasExactText(automation, pageMarker))
            clickText(automation, "Cancel")
            waitForTextToDisappear(automation, "Allow Steam profile detection?")
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun productionCsfloatInstallCanBeInspectedAndDeniedWithoutBreakingBrowsing() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val sessionId = SessionIdentifier("instrumentation-csfloat-denial-${UUID.randomUUID()}", "steam")
        val server = LoopbackFixture(UUID.randomUUID().toString().replace("-", ""))

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionId)
            server.start()
            open(context, sessionId, server.url("CSFLOAT-DENY"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForTextContaining(automation, "CSFloat: absent")
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            waitForTextContaining(automation, "*://*.steampowered.com/*")
            clickText(automation, "Deny CSFloat access")
            waitForTextContaining(
                automation,
                "CSFloat: consent denied; extension absent; browsing remains available.",
            )
            waitForTextContaining(automation, "PROD-GECKO|requested=CSFLOAT-DENY")
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun productionCsfloatDeniedVerificationFailureBlanksAndRetriesInspection() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val runMarker = UUID.randomUUID().toString().replace("-", "")
        val sessionId = SessionIdentifier("instrumentation-csfloat-denial-query-$runMarker", "steam")
        val server = LoopbackFixture(runMarker)
        val pageMarker = marker("DENIAL-QUERY", "DENIAL-QUERY", "DENIAL-QUERY", "DENIAL-QUERY")

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionId)
            server.start()
            open(context, sessionId, server.url("DENIAL-QUERY"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForText(automation, pageMarker)
            waitForTextContaining(automation, "CSFloat: absent")
            clickText(automation, "Test denied verification failure")
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            clickText(automation, "Deny CSFloat access")

            waitForTextContaining(
                automation,
                "CSFloat: consent denied but extension state could not be verified. Access was closed; retry inspection.",
            )
            waitForTextContaining(automation, "CSFloat popup: failed. Retry is available.")
            assertControlEnabled(automation, "Install CSFloat", false)
            waitForTextToDisappear(automation, pageMarker)
            waitForText(automation, "Open externally")

            clickText(automation, "Retry CSFloat")
            waitForTextContaining(
                automation,
                "CSFloat: consent denied; extension absent; browsing remains available.",
            )
            waitForText(automation, pageMarker)
            waitForTextContaining(automation, "CSFloat popup: unavailable")
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun productionCsfloatCleanupFailureBlanksThenRetriesToConfirmedAbsence() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val runMarker = UUID.randomUUID().toString().replace("-", "")
        val sessionId = SessionIdentifier("instrumentation-csfloat-cleanup-$runMarker", "steam")
        val server = LoopbackFixture(runMarker)
        val pageMarker = marker("CSFLOAT-CLEANUP", "CSFLOAT-CLEANUP", "CSFLOAT-CLEANUP", "CSFLOAT-CLEANUP")

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionId)
            server.start()
            open(context, sessionId, server.url("CSFLOAT-CLEANUP"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForText(automation, pageMarker)
            waitForTextContaining(automation, "CSFloat: absent")
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            clickText(automation, "Accept CSFloat access")
            waitForTextContaining(automation, "CSFloat popup: available")

            clickText(automation, "Test CSFloat cleanup failure")
            waitForTextContaining(
                automation,
                "CSFloat: cleanup incomplete; access was closed. Retry cleanup before browsing.",
            )
            waitForTextContaining(automation, "CSFloat popup: failed. Retry is available.")
            waitForTextToDisappear(automation, pageMarker)
            waitForText(automation, "Open externally")
            assertControlEnabled(automation, "Back", false)
            assertControlEnabled(automation, "Forward", false)
            assertControlEnabled(automation, "Refresh", false)
            assertControlEnabled(automation, "Install CSFloat", false)

            clickText(automation, "Close")
            stopBrowserWorker(context)
            open(context, sessionId, server.url("CSFLOAT-CLEANUP"))
            assertFalse(
                "Steam content loaded before quarantined extension inspection completed",
                hasExactText(automation, pageMarker),
            )
            waitForTextContaining(
                automation,
                "CSFloat: quarantine cleared; extension absent; browsing restored.",
            )
            waitForText(automation, pageMarker)
            waitForTextContaining(automation, "CSFloat popup: unavailable")
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun productionCsfloatTransitionsFromUnavailableToOfficialTrackingPopupAndRemainsIsolated() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val marker = UUID.randomUUID().toString().replace("-", "")
        val sessionA = SessionIdentifier("instrumentation-csfloat-a-$marker", "steam")
        val sessionB = SessionIdentifier("instrumentation-csfloat-b-$marker", "steam")
        val steamListing = "https://steamcommunity.com/market/listings/730/AK-47"

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionA, sessionB)

            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForTextContaining(automation, "CSFloat: absent")
            waitForTextContaining(automation, "CSFloat popup: unavailable")
            waitForTextContaining(automation, "CSFloat tracking: inactive")
            assertControlEnabled(automation, "Open CSFloat", false)
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            waitForTextContaining(automation, "ID: {194d0dc6-7ada-41c6-88b8-95d7636fe43c}")
            waitForTextContaining(automation, "Version: 5.17.0")
            clickText(automation, "Accept CSFloat access")
            waitForTextContaining(automation, "CSFloat: enabled")
            waitForTextContaining(
                automation,
                "CSFloat popup: available. Inspect tracking status inside the official popup.",
            )
            waitForTextContaining(automation, "CSFloat tracking: unknown")
            assertControlEnabled(automation, "Open CSFloat", true)
            clickText(automation, "Test CSFloat popup failure")
            clickText(automation, "Open CSFloat")
            waitForTextContaining(automation, "CSFloat: official popup failed to open. Retry.")
            waitForTextContaining(automation, "CSFloat popup: failed. Retry is available.")
            clickText(automation, "Retry CSFloat")
            waitForTextContaining(
                automation,
                "CSFloat popup: available. Inspect tracking status inside the official popup.",
            )
            clickText(automation, "Open CSFloat")
            waitForTextContaining(automation, "Offer Tracking Enabled")
            SystemClock.sleep(1_000)
            assertTrue(
                "Android Back did not close the official CSFloat popup",
                automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK),
            )
            waitForTextContaining(automation, "CSFloat: official popup opened")
            waitForTextContaining(
                automation,
                "CSFloat popup: opened. Tracking status is shown only inside the official popup.",
            )
            clickText(automation, "Record visible CSFloat tracking active")
            waitForTextContaining(automation, "CSFloat tracking: active")
            clickText(automation, "Test CSFloat background failure")
            waitForTextContaining(automation, "CSFloat tracking: failed")
            clickText(automation, "Retry CSFloat")
            waitForTextContaining(automation, "CSFloat tracking: unknown")

            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForTextContaining(automation, "CSFloat: absent")
            assertFalse("Session B exposed session A's opened CSFloat popup state", hasTextContaining(
                automation.rootInActiveWindow,
                "CSFloat popup: opened",
            ))

            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled")
            waitForTextContaining(
                automation,
                "CSFloat popup: available. Inspect tracking status inside the official popup.",
            )
        } finally {
            stopBrowserWorker(context)
        }
    }

    @Test
    fun productionCsfloatCanBeDisabledEnabledUninstalledReinstalledAndKeepsOtherSessionEnabled() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val sessionA = SessionIdentifier("instrumentation-csfloat-issue11-restart-a", "steam")
        val sessionB = SessionIdentifier("instrumentation-csfloat-issue11-restart-b", "steam")
        val steamListing = "https://steamcommunity.com/market/listings/730/AK-47"

        if (InstrumentationRegistry.getArguments().getString("issue11RestartPhase") == "verify-after-force-stop") {
            try {
                stopBrowserWorker(context)
                BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
                waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
                BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
                waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            } finally {
                stopBrowserWorker(context)
            }
            return@runBlocking
        }

        try {
            stopBrowserWorker(context)
            clearSyntheticDetectorConsent(context, sessionA, sessionB)
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForTextContaining(automation, "CSFloat: absent")
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            clickText(automation, "Accept CSFloat access")
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")

            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForText(automation, "Allow Steam profile detection?")
            clickText(automation, "Allow and continue")
            waitForTextContaining(automation, "CSFloat: absent")
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            clickText(automation, "Accept CSFloat access")
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")

            clickText(automation, "Test CSFloat mutation failure")
            clickText(automation, "Disable CSFloat")
            waitForTextContaining(automation, "CSFloat: disable failed; access remains closed. Retry.")
            assertControlEnabled(automation, "Install CSFloat", false)
            clickText(automation, "Retry CSFloat")
            waitForTextContaining(automation, "CSFloat: disabled (5.17.0, signed)")
            waitForTextContaining(automation, "CSFloat popup: unavailable")
            waitForTextContaining(automation, "CSFloat tracking: inactive")
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: disabled (5.17.0, signed)")
            clickText(automation, "Enable CSFloat")
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")

            clickText(automation, "Test pinned CSFloat update")
            waitForTextContaining(automation, "CSFloat update denied: reviewed version 5.17.0 remains pinned.")
            waitForTextContaining(
                automation,
                "CSFloat update test: DENY confirmed; controller reported no update; exact 5.17.0 signed enabled unchanged.",
            )
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            clickText(automation, "Test CSFloat update failure")
            clickText(automation, "Test pinned CSFloat update")
            waitForTextContaining(
                automation,
                "CSFloat update test failed: controller update failed; access remains closed. Retry.",
            )
            assertFalse(
                "Controller failure was falsely reported as successful DENY",
                hasTextContaining(automation.rootInActiveWindow, "controller reported no update"),
            )
            clickText(automation, "Retry CSFloat")
            waitForTextContaining(automation, "CSFloat update failure recovered")
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            clickText(automation, "Uninstall CSFloat")
            waitForTextContaining(automation, "CSFloat: absent")

            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")

            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: absent")
            clickText(automation, "Install CSFloat")
            waitForText(automation, "Install-time CSFloat access request")
            clickText(automation, "Accept CSFloat access")
            clickText(automation, "Close")
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            clickText(automation, "Test activity recreation")
            waitForTextContaining(automation, "CSFloat: recreating activity")
            waitForTextContaining(automation, "CSFloat test: activity recreated")
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")

            stopBrowserWorker(context)
            BrowserProcessController.openWebsite(context, sessionA, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
            BrowserProcessController.openWebsite(context, sessionB, steamListing, listOf("steamcommunity.com"))
            waitForTextContaining(automation, "CSFloat: enabled (5.17.0, signed)")
        } finally {
            stopBrowserWorker(context)
        }
    }

    @Test
    fun marketplaceExtensionsRequireConsentOpenOfficialPopupsAndPersistInIsolation() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val selected = InstrumentationRegistry.getArguments().getString("extensionWebsite")
        val sites = listOf("csfloat", "csmoney", "skins_com").filter { selected == null || it == selected }
        val run = UUID.randomUUID().toString()
        val server = LoopbackFixture(run.replace("-", ""))
        server.start()
        try {
            for (websiteId in sites) {
                val pkg = requireNotNull(BrowserExtensionPackages.forWebsite(websiteId))
                val website = BuiltInWebsites.all.single { it.id == websiteId }
                val a = SessionIdentifier("extension-a-$run", websiteId)
                val b = SessionIdentifier("extension-b-$run", websiteId)
                val domains = listOf(LOOPBACK_HOST, website.domain) + website.allowedAuthDomains
                suspend fun openProfile(id: SessionIdentifier) =
                    BrowserProcessController.openWebsite(context, id, server.url("EXTENSION"), domains)
                stopBrowserWorker(context)
                openProfile(a)
                waitForTextContaining(automation, "${pkg.NAME}: absent")
                assertFalse("Marketplace incorrectly requested profile detector consent", hasExactText(automation, "Allow Steam profile detection?"))
                clickText(automation, "Install ${pkg.NAME}")
                waitForText(automation, "Install-time ${pkg.NAME} access request")
                capturePublicProof(context, automation, "$websiteId-consent")
                clickText(automation, "Deny ${pkg.NAME} access")
                waitForTextContaining(automation, "${pkg.NAME}: consent denied; extension absent")
                clickText(automation, "Install ${pkg.NAME}")
                waitForText(automation, "Install-time ${pkg.NAME} access request")
                val needsAndroidNotificationConsent = websiteId == "csmoney" && android.os.Build.VERSION.SDK_INT >= 33 &&
                    context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED
                clickText(automation, "Accept ${pkg.NAME} access")
                if (needsAndroidNotificationConsent) {
                    waitForText(automation, "Allow")
                    clickText(automation, "Allow")
                }
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                capturePublicProof(context, automation, "$websiteId-enabled")
                if (websiteId == "skins_com") {
                    clickText(automation, "Test revoke Steam API access")
                    waitForTextContaining(automation, "Skins.com: Steam API access removed")
                }
                clickText(automation, "Open ${pkg.NAME}")
                waitForTextContaining(automation, when (websiteId) {
                    "csmoney" -> "SIGN IN VIA STEAM"
                    "skins_com" -> "Log in"
                    else -> "Offer Tracking Enabled"
                })
                capturePublicProof(context, automation, "$websiteId-popup")
                if (websiteId == "csmoney") {
                    repeat(3) {
                        val button = requireNotNull(findExactText(automation.rootInActiveWindow, "SIGN IN VIA STEAM"))
                        val bounds = android.graphics.Rect().also { button.getBoundsInScreen(it) }
                        button.recycle()
                        val windowBounds = android.graphics.Rect().also { automation.rootInActiveWindow.getBoundsInScreen(it) }
                        // GV153 popup nodes include the dialog inset twice on this API36 emulator.
                        bounds.offset(-windowBounds.left, -windowBounds.top)
                        val down = SystemClock.uptimeMillis()
                        for (action in listOf(android.view.MotionEvent.ACTION_DOWN, android.view.MotionEvent.ACTION_UP)) {
                            val event = android.view.MotionEvent.obtain(down, SystemClock.uptimeMillis(), action,
                                bounds.centerX().toFloat(), bounds.centerY().toFloat(), 0)
                            event.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
                            assertTrue(automation.injectInputEvent(event, true))
                            event.recycle()
                            SystemClock.sleep(100)
                        }
                        SystemClock.sleep(2_000)
                        waitForTextToDisappear(automation, "SIGN IN VIA STEAM")
                        waitForTextContaining(automation, "Sign in")
                        assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK))
                        clickText(automation, "Open CS.MONEY")
                        waitForText(automation, "SIGN IN VIA STEAM")
                    }
                }
                if (websiteId == "skins_com") {
                    waitForText(automation, "Enable")
                    assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK))
                    clickText(automation, "Website access")
                    waitForText(automation, "Skins.com website access")
                    capturePublicProof(context, automation, "skins_com-host-consent")
                    assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK))
                    clickText(automation, "Open Skins.com")
                    waitForText(automation, "Enable")
                    assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK))
                    clickText(automation, "Website access")
                    clickText(automation, "Allow listed websites")
                    waitForTextContaining(automation, "Skins.com: website access allowed")
                    clickText(automation, "Open Skins.com")
                    waitForText(automation, "Log in")
                    assertFalse("Host access was not restored", hasExactText(automation, "Enable"))
                }
                assertTrue(automation.performGlobalAction(AccessibilityService.GLOBAL_ACTION_BACK))
                waitForTextContaining(automation, "${pkg.NAME}: official popup opened")
                openProfile(b)
                waitForTextContaining(automation, "${pkg.NAME}: absent")
                clickText(automation, "Install ${pkg.NAME}")
                waitForText(automation, "Install-time ${pkg.NAME} access request")
                clickText(automation, "Accept ${pkg.NAME} access")
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                openProfile(a)
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                clickText(automation, "Disable ${pkg.NAME}")
                waitForTextContaining(automation, "${pkg.NAME}: disabled")
                openProfile(b)
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                stopBrowserWorker(context)
                openProfile(a)
                waitForTextContaining(automation, "${pkg.NAME}: disabled")
                clickText(automation, "Enable ${pkg.NAME}")
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                clickText(automation, "Uninstall ${pkg.NAME}")
                waitForTextContaining(automation, "${pkg.NAME}: absent; browsing restored.")
                clickText(automation, "Install ${pkg.NAME}")
                waitForText(automation, "Install-time ${pkg.NAME} access request")
                clickText(automation, "Accept ${pkg.NAME} access")
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                openProfile(b)
                waitForTextContaining(automation, "${pkg.NAME}: enabled (${pkg.VERSION}, signed)")
                assertOneBrowserWorker(context)
            }
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun forcedShutdownCannotResurrectThePreviousProfile() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val run = UUID.randomUUID().toString().replace("-", "")
        val server = LoopbackFixture(run, persistentCookies = true)
        val a = SessionIdentifier("forced-a-$run", "csmoney")
        val b = SessionIdentifier("forced-b-$run", "csmoney")
        suspend fun openProfile(id: SessionIdentifier, slot: String) =
            BrowserProcessController.openWebsite(context, id, server.url(slot), listOf(LOOPBACK_HOST))
        server.start()
        try {
            stopBrowserWorker(context)
            openProfile(a, "A")
            waitForText(automation, marker("A", "A", "A", "A"))
            // Establish durable state before simulating a crash; fresh writes may still be buffered.
            stopBrowserWorker(context)
            openProfile(a, "A-persisted")
            waitForText(automation, marker("A-persisted", "A", "A", "A"))
            val oldGeneration = browserProcesses(context).associate { it.pid to it.processName }
            clickText(automation, "Test unresponsive browser worker")
            SystemClock.sleep(500)
            // Route from this process without querying accessibility on the deliberately stalled worker.
            openProfile(b, "B")
            waitForText(automation, marker("B", "B", "B", "B"))
            assertPriorGenerationGone(context, oldGeneration)
            assertOneBrowserWorker(context)
            openProfile(a, "A-return")
            waitForText(automation, marker("A-return", "A", "A", "A"))
            assertOneBrowserWorker(context)
        } finally {
            stopBrowserWorker(context)
            server.close()
        }
    }

    @Test
    fun supportedPublicWebsitesOpenThroughGecko() = runBlocking {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        val automation = instrumentation.uiAutomation
        val selected = InstrumentationRegistry.getArguments().getString("siteWebsite")
        val sites = BuiltInWebsites.all.map { Triple(it.id, it.url, listOf(it.domain) + it.allowedAuthDomains) } +
            Triple("custom_https", "https://example.com/", listOf("example.com"))
        val failedSites = mutableListOf<String>()
        try {
            for ((id, url, domains) in sites.filter { selected == null || it.first == selected }) {
                val profile = SessionIdentifier("public-site-${UUID.randomUUID()}", id)
                BrowserProcessController.openWebsite(context, profile, url, domains)
                if (id == "steam") {
                    waitForText(automation, "Allow Steam profile detection?")
                    clickText(automation, "Allow and continue")
                }
                val loaded = waitUntil(60_000) { hasExactText(automation, "Gecko page: ready") }
                SystemClock.sleep(1_500)
                // Steam's login page can contain a live QR payload; do not capture authentication UI.
                if (id != "steam") capturePublicProof(context, automation, "site-$id")
                if (!loaded) failedSites.add(id)
                assertOneBrowserWorker(context)
            }
            assertTrue("Public websites did not finish loading: $failedSites", failedSites.isEmpty())
        } finally {
            stopBrowserWorker(context)
        }
    }

    private fun capturePublicProof(context: Context, automation: android.app.UiAutomation, name: String) {
        // Accessibility labels can arrive before Gecko's first rendered frame/dialog animation.
        SystemClock.sleep(1_000)
        val directory = java.io.File(context.filesDir, "verification").apply { mkdirs() }
        val bitmap = requireNotNull(automation.takeScreenshot())
        java.io.File(directory, "$name.png").outputStream().use {
            assertTrue(bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it))
        }
        bitmap.recycle()
    }

    private suspend fun open(context: Context, sessionId: SessionIdentifier, url: String) {
        BrowserProcessController.openWebsite(
            context = context,
            sessionId = sessionId,
            targetUrl = url,
            allowedDomains = listOf(LOOPBACK_HOST),
        )
    }

    private fun clearSyntheticDetectorConsent(
        context: Context,
        vararg sessionIds: SessionIdentifier,
    ) {
        val preferences = context.getSharedPreferences(
            BrowserActivity.DETECTOR_CONSENT_PREFERENCES,
            Context.MODE_PRIVATE,
        )
        val keys = sessionIds.map {
            BrowserActivity.detectorConsentKey(GeckoProfileIdentity.idFor(it))
        }
        // SharedPreferences caches are process-local. Force a value transition so this
        // default-process test rewrites consent granted by the stopped :browser process.
        val primingEditor = preferences.edit()
        keys.forEach { primingEditor.putBoolean(it, true) }
        assertTrue("Could not prime synthetic detector consent", primingEditor.commit())
        val clearingEditor = preferences.edit()
        keys.forEach { clearingEditor.putBoolean(it, false) }
        assertTrue("Could not reset synthetic detector consent", clearingEditor.commit())
    }

    private fun assertNoGeckoChildren(context: Context) {
        val exactWorker = context.packageName + ":browser"
        val children = browserProcesses(context).filter { it.processName != exactWorker }
        assertTrue("Gecko child processes started before renewed detector consent: $children", children.isEmpty())
    }

    private suspend fun stopBrowserWorker(context: Context) {
        assertTrue(
            "Explicit shutdown did not clear app-owned browser processes within the bound",
            BrowserProcessController.stopBrowser(context),
        )
    }

    private fun assertOneBrowserWorker(context: Context) {
        val exactWorker = context.packageName + ":browser"
        val workers = browserProcesses(context).filter { it.processName == exactWorker }
        assertEquals("Expected exactly one production :browser worker", 1, workers.size)
    }

    private fun assertPriorGenerationGone(
        context: Context,
        priorGeneration: Map<Int, String>,
    ) {
        val current = browserProcesses(context).associate { it.pid to it.processName }
        val stale = priorGeneration.filter { (pid, name) -> current[pid] == name }
        assertTrue("Switch retained app-owned processes from the prior generation: $stale", stale.isEmpty())
    }

    private fun browserProcesses(context: Context): List<ActivityManager.RunningAppProcessInfo> {
        val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return manager.runningAppProcesses.orEmpty().filter {
            BrowserProcessController.isOwnedBrowserProcessName(context.packageName, it.processName)
        }
    }

    private fun marker(requested: String, cookie: String, local: String, idb: String) =
        "PROD-GECKO|requested=$requested|cookie=$cookie|local=$local|idb=$idb"

    private fun waitForText(automation: android.app.UiAutomation, expected: String) {
        assertTrue("Timed out waiting for accessibility marker: $expected", waitUntil(UI_TIMEOUT_MS) {
            hasExactText(automation, expected)
        })
    }

    private fun waitForTextToDisappear(automation: android.app.UiAutomation, expected: String) {
        assertTrue("Accessibility marker remained visible: $expected", waitUntil(UI_TIMEOUT_MS) {
            !hasExactText(automation, expected)
        })
    }

    private fun waitForTextContaining(automation: android.app.UiAutomation, expected: String) {
        assertTrue("Timed out waiting for accessibility text containing: $expected", waitUntil(UI_TIMEOUT_MS) {
            hasTextContaining(automation.rootInActiveWindow, expected) || automation.windows.any {
                hasTextContaining(it.root, expected)
            }
        })
    }

    private fun hasTextContaining(root: AccessibilityNodeInfo?, expected: String): Boolean {
        if (root == null) return false
        if (root.text?.toString()?.contains(expected) == true ||
            root.contentDescription?.toString()?.contains(expected) == true
        ) return true
        for (index in 0 until root.childCount) {
            if (hasTextContaining(root.getChild(index), expected)) return true
        }
        return false
    }

    private fun clickText(automation: android.app.UiAutomation, expected: String) {
        var clicked = false
        assertTrue("Timed out waiting to click: $expected", waitUntil(UI_TIMEOUT_MS) {
            val node = findExactText(automation.rootInActiveWindow, expected)
            var clickable = node
            while (clickable != null && !clicked) {
                clicked = clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                val parent = if (clicked) null else clickable.parent
                if (clickable !== node) clickable.recycle()
                clickable = parent
            }
            node?.recycle()
            clicked
        })
    }

    private fun assertControlEnabled(
        automation: android.app.UiAutomation,
        description: String,
        expected: Boolean,
    ) {
        assertTrue("Control $description did not reach enabled=$expected", waitUntil(UI_TIMEOUT_MS) {
            val node = findExactText(automation.rootInActiveWindow, description)
            var current = node
            var enabled = true
            while (current != null) {
                enabled = enabled && current.isEnabled
                val parent = current.parent
                if (current !== node) current.recycle()
                current = parent
            }
            val matches = node != null && enabled == expected
            node?.recycle()
            matches
        })
    }

    private fun hasExactText(automation: android.app.UiAutomation, expected: String): Boolean {
        val node = findExactText(automation.rootInActiveWindow, expected)
        node?.recycle()
        return node != null
    }

    private fun findExactText(root: AccessibilityNodeInfo?, expected: String): AccessibilityNodeInfo? {
        if (root == null) return null
        if (root.text?.toString() == expected || root.contentDescription?.toString() == expected) {
            return AccessibilityNodeInfo.obtain(root)
        }
        for (index in 0 until root.childCount) {
            findExactText(root.getChild(index), expected)?.let { return it }
        }
        return null
    }

    private fun waitUntil(timeoutMs: Long, condition: () -> Boolean): Boolean {
        val deadline = SystemClock.elapsedRealtime() + timeoutMs
        while (SystemClock.elapsedRealtime() < deadline) {
            if (condition()) return true
            SystemClock.sleep(POLL_INTERVAL_MS)
        }
        return condition()
    }

    private class LoopbackFixture(
        private val runMarker: String,
        private val persistentCookies: Boolean = false,
    ) : Closeable {
        private val running = AtomicBoolean(false)
        private var server: ServerSocket? = null
        private var worker: Thread? = null
        private val recoverableFailure = AtomicBoolean(true)

        fun start() {
            val socket = ServerSocket(LOOPBACK_PORT, 16, InetAddress.getByName(LOOPBACK_HOST)).apply {
                reuseAddress = true
            }
            server = socket
            running.set(true)
            worker = thread(name = "production-gecko-loopback", isDaemon = true) {
                while (running.get()) {
                    try {
                        socket.accept().use { client ->
                            try {
                                respond(client)
                            } catch (_: Exception) {
                                // Gecko may preconnect and close without sending a request.
                            }
                        }
                    } catch (_: Exception) {
                        if (!running.get()) return@thread
                    }
                }
            }
        }

        fun allowRecovery() {
            recoverableFailure.set(false)
        }

        fun url(slot: String) = "http://$LOOPBACK_HOST:$LOOPBACK_PORT/fixture?slot=$slot&run=$runMarker"

        private fun respond(client: Socket) {
            client.soTimeout = 2_000
            val reader = BufferedReader(InputStreamReader(client.getInputStream(), StandardCharsets.US_ASCII))
            val request = reader.readLine() ?: return
            while (!reader.readLine().isNullOrEmpty()) Unit
            if (request.contains(" /auth-redirect?")) {
                val headers = buildString {
                    append("HTTP/1.1 302 Found\r\n")
                    append("Location: /auth?slot=AUTH\r\n")
                    append("Cache-Control: no-store\r\n")
                    append("Content-Length: 0\r\n")
                    append("Connection: close\r\n\r\n")
                }.toByteArray(StandardCharsets.US_ASCII)
                client.getOutputStream().apply {
                    write(headers)
                    flush()
                }
                return
            }
            if (request.contains(" /flaky") && recoverableFailure.get()) return
            val body = fixtureHtml(runMarker, request.contains(" /flaky")).toByteArray(StandardCharsets.UTF_8)
            val headers = buildString {
                append("HTTP/1.1 200 OK\r\n")
                append("Content-Type: text/html; charset=utf-8\r\n")
                append("Cache-Control: no-store\r\n")
                append("Content-Length: ${body.size}\r\n")
                append("Connection: close\r\n\r\n")
            }.toByteArray(StandardCharsets.US_ASCII)
            client.getOutputStream().apply {
                write(headers)
                write(body)
                flush()
            }
        }

        override fun close() {
            running.set(false)
            server?.close()
            worker?.join(2_000)
        }

        private fun fixtureHtml(run: String, recovered: Boolean) = """
            <!doctype html><html><head><meta charset="utf-8"><title>PROD-GECKO|loading</title></head>
            <body><main id="marker">PROD-GECKO|loading</main>
            <nav>
              <a href="/shell?slot=SHELL-B">Allowed page</a>
              <a href="/auth-redirect?slot=AUTH">Authentication redirect</a>
              <a href="$BLOCKED_URI">Blocked web link</a>
              <a href="mailto:synthetic@example.invalid">Rejected non-web link</a>
              <a href="/flaky?slot=RECOVERED">Recoverable failure</a>
            </nav><script>
            (() => {
              const requested = ${if (recovered) "'RECOVERED'" else "new URL(location.href).searchParams.get('slot')"};
              const scope = '$run';
              const cookieName = 'prod_' + scope;
              const localKey = 'prod-local-' + scope;
              const cookieMatch = document.cookie.split('; ').find(v => v.startsWith(cookieName + '='));
              if (!cookieMatch) document.cookie = cookieName + '=' + requested + '; Path=/; SameSite=Lax${if (persistentCookies) "; Max-Age=86400" else ""}';
              if (!localStorage.getItem(localKey)) localStorage.setItem(localKey, requested);
              const database = indexedDB.open('prod-gecko-' + scope, 1);
              database.onupgradeneeded = () => database.result.createObjectStore('state');
              database.onsuccess = () => {
                const transaction = database.result.transaction('state', 'readwrite');
                const store = transaction.objectStore('state');
                const read = store.get('value');
                read.onsuccess = () => {
                  const idb = read.result || requested;
                  if (!read.result) store.put(requested, 'value');
                  const cookie = (document.cookie.match(new RegExp(cookieName + '=([^;]+)')) || [,'missing'])[1];
                  const local = localStorage.getItem(localKey) || 'missing';
                  const marker = 'PROD-GECKO|requested=' + requested + '|cookie=' + cookie +
                    '|local=' + local + '|idb=' + idb;
                  transaction.oncomplete = () => {
                    document.title = /^(SHELL-|AUTH|RECOVERED)/.test(requested) ? 'PROD-GECKO|' + requested : marker;
                    document.getElementById('marker').textContent = marker;
                  };
                };
              };
            })();
            </script></body></html>
        """.trimIndent()
    }

    companion object {
        private const val LOOPBACK_HOST = "127.0.0.1"
        private const val LOOPBACK_PORT = 38949
        private const val UI_TIMEOUT_MS = 30_000L
        private const val POLL_INTERVAL_MS = 100L
        private const val BLOCKED_URI = "https://example.invalid/synthetic-blocked"
        private const val REJECTED_NAVIGATION_MESSAGE =
            "This link cannot be opened safely. You can stay here and try another link."
        private const val SYNTHETIC_BRIDGE_AVATAR_URL =
            "https://avatars.steamstatic.com/synthetic_bridge_avatar.jpg"
        private const val SYNTHETIC_BRIDGE_PROFILE_ID = "sam-geckoview-synthetic-bridge"
    }
}

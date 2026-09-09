package com.steamaccountmanager.app.prototype

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PrototypeContractTest {
    @Test
    fun `navigation gate allows only exact fixture and secure Steam destinations`() {
        assertTrue(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/A", "A"))
        assertTrue(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/A#A-history", "A"))
        assertTrue(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/A/next#A-history", "A"))
        assertFalse(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/A/other", "A"))
        assertTrue(isPrototypeNavigationAllowed("https://steamcommunity.com/openid/login", "A"))
        assertTrue(isPrototypeNavigationAllowed("https://login.steampowered.com/jwt/finalizelogin", "A"))
        assertTrue(isPrototypeNavigationAllowed("https://store.steampowered.com/login/", "A"))
        assertTrue(isPrototypeNavigationAllowed("https://help.steampowered.com/en/wizard/HelpWithLogin", "A"))

        assertFalse(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/B", "A"))
        assertFalse(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/A#B-history", "A"))
        assertFalse(isPrototypeNavigationAllowed("http://127.0.0.1:38947/slot/A?slot=A", "A"))
        assertFalse(isPrototypeNavigationAllowed("http://user@127.0.0.1:38947/slot/A", "A"))
        assertFalse(isPrototypeNavigationAllowed("https://steamcommunity.com.evil.invalid/", "A"))
        assertFalse(isPrototypeNavigationAllowed("https://example.invalid/secret?token=hidden#fragment", "A"))
        assertFalse(isPrototypeNavigationAllowed("http://steamcommunity.com/", "A"))
        assertFalse(isPrototypeNavigationAllowed("intent://steamcommunity.com/", "A"))
        assertFalse(isPrototypeNavigationAllowed("not a URI", "A"))
        assertFalse(isPrototypeNavigationAllowed("https://user@steamcommunity.com/", "A"))
    }

    @Test
    fun `blocked navigation state is fixed and redacted`() {
        assertEquals(
            "GV-NAVIGATION-BLOCKED: Destination blocked. Stay here or open it in your external browser.",
            PROTOTYPE_NAVIGATION_BLOCKED_MESSAGE,
        )
        assertFalse(PROTOTYPE_NAVIGATION_BLOCKED_MESSAGE.contains("example.invalid"))
        assertFalse(PROTOTYPE_NAVIGATION_BLOCKED_MESSAGE.contains("token="))
        assertEquals(
            "GV-EXTERNAL-HANDOFF-UNAVAILABLE: No external browser can open this destination. Stay here.",
            PROTOTYPE_EXTERNAL_HANDOFF_UNAVAILABLE_MESSAGE,
        )
    }

    @Test
    fun `external handoff accepts only well formed web destinations`() {
        assertTrue(isPrototypeExternalHandoffEligible("https://example.invalid/path?redacted=yes"))
        assertTrue(isPrototypeExternalHandoffEligible("HTTP://example.invalid/path"))
        assertFalse(isPrototypeExternalHandoffEligible("not a URI"))
        assertFalse(isPrototypeExternalHandoffEligible("https:///missing-host"))
        assertFalse(isPrototypeExternalHandoffEligible("https://user@example.invalid/path"))
        assertFalse(isPrototypeExternalHandoffEligible("intent://example.invalid/path"))
    }

    @Test
    fun `consent identity must match the exact CSFloat package`() {
        assertTrue(isExpectedCsfloat(CSFLOAT_ID, CSFLOAT_VERSION))
        assertFalse(isExpectedCsfloat("unexpected@example.invalid", CSFLOAT_VERSION))
        assertFalse(isExpectedCsfloat(CSFLOAT_ID, "5.17.1"))
        assertFalse(isExpectedCsfloat(null, CSFLOAT_VERSION))
    }

    @Test
    fun `install prompt shows callback identity and every callback item verbatim`() {
        val prompt = installPrompt(
            name = "Callback name",
            id = CSFLOAT_ID,
            version = CSFLOAT_VERSION,
            permissions = listOf("nativeMessaging", "tabs", "tabs"),
            origins = listOf("*://*.steampowered.com/*", "https://example.invalid/path"),
            dataCollectionPermissions = listOf("technicalAndInteraction"),
        )

        assertTrue(prompt.contains("Extension: Callback name"))
        assertTrue(prompt.contains("ID: $CSFLOAT_ID"))
        assertTrue(prompt.contains("Version: $CSFLOAT_VERSION"))
        assertTrue(prompt.contains("Permissions (3):\n• nativeMessaging\n• tabs\n• tabs"))
        assertTrue(prompt.contains("Origins (2):\n• *://*.steampowered.com/*\n• https://example.invalid/path"))
        assertTrue(prompt.contains("Data collection (1):\n• technicalAndInteraction"))
    }

    @Test
    fun `diagnostics are fixed allow-listed codes`() {
        assertEquals(
            "GV-INSTALL-FAILED: Could not download or install CSFloat. Check the network and retry.",
            PrototypeDiagnostic.INSTALL_FAILED.message,
        )
        assertEquals(
            "GV-INSTALL-NO-RESULT: GeckoView returned no installed extension. Retry.",
            PrototypeDiagnostic.INSTALL_NO_RESULT.message,
        )
        assertEquals(
            "GV-PAGE-LOAD-FAILED: The public Steam listing did not load. Check the network and retry.",
            PrototypeDiagnostic.PAGE_LOAD_FAILED.message,
        )
        PrototypeDiagnostic.entries.forEach { diagnostic ->
            assertFalse(diagnostic.message.contains("steamLoginSecure=secret-token"))
        }
    }

    @Test
    fun `denial reports only expected extension engine state`() {
        assertEquals(DenialState.EXPECTED_ABSENT, denialState(emptyList()))
        assertEquals(DenialState.EXPECTED_DISABLED, denialState(listOf(false)))
        assertEquals(DenialState.EXPECTED_ENABLED, denialState(listOf(false, true)))
        assertEquals(
            "GV-INSTALL-DENIED-ABSENT: Consent denied; engine reports expected CSFloat ID absent. Retry is available.",
            denialMessage(DenialState.EXPECTED_ABSENT),
        )
        assertEquals(
            "GV-INSTALL-DENIED-DISABLED: Consent denied; engine reports expected CSFloat ID disabled. Retry is available.",
            denialMessage(DenialState.EXPECTED_DISABLED),
        )
        assertEquals(
            "GV-INSTALL-DENIED-ENABLED: Consent denied, but engine reports expected CSFloat ID enabled. Close the prototype.",
            denialMessage(DenialState.EXPECTED_ENABLED),
        )
    }

    @Test
    fun `action availability requires exact enabled CSFloat`() {
        assertTrue(isEnabledExpectedExtension(CSFLOAT_ID, CSFLOAT_VERSION, true))
        assertFalse(isEnabledExpectedExtension(CSFLOAT_ID, CSFLOAT_VERSION, false))
        assertFalse(isEnabledExpectedExtension(CSFLOAT_ID, "5.17.1", true))
        assertFalse(isEnabledExpectedExtension("other@example.invalid", CSFLOAT_VERSION, true))
    }

    @Test
    fun `revocation targets the CSFloat ID across versions but enable remains pinned`() {
        assertTrue(isCsfloatRevocationTarget(CSFLOAT_ID))
        assertFalse(isCsfloatRevocationTarget("other@example.invalid"))
        assertFalse(isEnabledExpectedExtension(CSFLOAT_ID, "5.17.1", true))
    }

    @Test
    fun `cached action reuse requires fresh exact enabled same identity validation`() {
        assertTrue(
            canReuseValidatedAction(
                CSFLOAT_ID,
                CSFLOAT_VERSION,
                CSFLOAT_ID,
                CSFLOAT_VERSION,
                discoveredEnabled = true,
                hasEffectiveAction = true,
            ),
        )
        assertFalse(canReuseValidatedAction(CSFLOAT_ID, CSFLOAT_VERSION, null, null, true, true))
        assertFalse(canReuseValidatedAction(CSFLOAT_ID, CSFLOAT_VERSION, CSFLOAT_ID, CSFLOAT_VERSION, false, true))
        assertFalse(canReuseValidatedAction(CSFLOAT_ID, CSFLOAT_VERSION, "other", CSFLOAT_VERSION, true, true))
        assertFalse(canReuseValidatedAction(CSFLOAT_ID, CSFLOAT_VERSION, CSFLOAT_ID, "5.17.1", true, true))
        assertFalse(canReuseValidatedAction(CSFLOAT_ID, CSFLOAT_VERSION, CSFLOAT_ID, CSFLOAT_VERSION, true, false))
    }

    @Test
    fun `extension revocation makes official action and tracking unavailable`() {
        val tracking = PrototypeTracking().apply { actionAvailable() }
        val openedRequest = requireNotNull(tracking.requestAction {})
        tracking.popupOpened(openedRequest)
        tracking.recordVisibleOfficialStatus()
        assertEquals(TrackingState.ACTIVE, tracking.state)
        assertTrue(tracking.officialSurfaceOpened)
        assertEquals(2L, tracking.requestAction {})

        tracking.unavailable()

        assertEquals(TrackingState.UNAVAILABLE, tracking.state)
        assertEquals(null, tracking.inFlightRequestId)
        assertFalse(tracking.officialSurfaceOpened)
        assertEquals(null, tracking.requestAction {})
    }

    @Test
    fun `all tracking states render without claiming live proof`() {
        assertEquals("GV-ACTION-UNAVAILABLE: Install and enable exact CSFloat first.", trackingMessage(TrackingState.UNAVAILABLE))
        assertEquals("GV-ACTION-READY: Official CSFloat action is ready. Live authenticated proof pending #7.", trackingMessage(TrackingState.READY))
        assertEquals("GV-ACTION-ACTIVE: Visible official CSFloat status recorded. Live authenticated proof pending #7.", trackingMessage(TrackingState.ACTIVE))
        assertEquals("GV-ACTION-FAILED: Official CSFloat popup failed. Recover and retry.", trackingMessage(TrackingState.FAILED))
    }

    @Test
    fun `visible status can be recorded only after matching official popup opened`() {
        val tracking = PrototypeTracking()
        tracking.actionAvailable()
        tracking.recordVisibleOfficialStatus()
        tracking.popupOpened(99L)
        tracking.recordVisibleOfficialStatus()

        assertEquals(TrackingState.READY, tracking.state)
        val request = tracking.requestAction {}
        tracking.popupOpened(requireNotNull(request))

        assertEquals(TrackingState.READY, tracking.state)
        tracking.recordVisibleOfficialStatus()
        assertEquals(TrackingState.ACTIVE, tracking.state)
    }

    @Test
    fun `action requests are monotonic exact once and ignore duplicates and late callbacks`() {
        val tracking = PrototypeTracking().apply { actionAvailable() }
        var clicks = 0

        val first = tracking.requestAction { clicks++ }
        assertEquals(1L, first)
        assertEquals(null, tracking.requestAction { clicks++ })
        assertEquals(1, clicks)

        tracking.popupOpened(requireNotNull(first))
        tracking.popupFailed(first)
        val second = tracking.requestAction { clicks++ }
        assertEquals(2L, second)
        tracking.popupFailed(requireNotNull(second))
        tracking.popupOpened(second)

        assertEquals(2, clicks)
        assertEquals(TrackingState.FAILED, tracking.state)
        assertEquals(null, tracking.inFlightRequestId)
    }

    @Test
    fun `null terminal callbacks do nothing without an in-flight request`() {
        val tracking = PrototypeTracking().apply { actionAvailable() }

        tracking.popupOpened(null)
        tracking.popupFailed(null)
        tracking.actionClickFailed(null)
        tracking.recordVisibleOfficialStatus()

        assertEquals(TrackingState.READY, tracking.state)
        assertFalse(tracking.officialSurfaceOpened)
        assertEquals(null, tracking.inFlightRequestId)
    }

    @Test
    fun `completed request token cannot complete newer request after recovery`() {
        val tracking = PrototypeTracking().apply { actionAvailable() }
        val first = requireNotNull(tracking.requestAction {})
        tracking.popupFailed(first)
        tracking.recover()
        tracking.actionAvailable()
        val second = requireNotNull(tracking.requestAction {})

        tracking.popupOpened(first)

        assertEquals(second, tracking.inFlightRequestId)
        assertFalse(tracking.officialSurfaceOpened)
        tracking.popupOpened(second)
        assertEquals(null, tracking.inFlightRequestId)
        assertTrue(tracking.officialSurfaceOpened)
    }

    @Test
    fun `simulation fails deterministically and recovery requires a new enabled action callback`() {
        val tracking = PrototypeTracking().apply { actionAvailable() }
        tracking.simulatePopupFailure()
        assertEquals(TrackingState.FAILED, tracking.state)
        assertEquals("GV-SIMULATED-POPUP-FAILURE: Test-only failure recorded. Recover to rediscover CSFloat.", tracking.diagnostic)

        tracking.recover()
        assertEquals(TrackingState.UNAVAILABLE, tracking.state)
        assertEquals(null, tracking.requestAction {})
        tracking.actionAvailable()
        assertEquals(TrackingState.READY, tracking.state)
    }
}

package com.steamaccountmanager.app.browser

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CsfloatExtensionContractTest {
    @Test
    fun trackingContractDistinguishesEveryTruthfulPublicState() {
        assertEquals("CSFloat tracking: active", csfloatTrackingMessage(CsfloatTrackingState.ACTIVE))
        assertEquals("CSFloat tracking: inactive", csfloatTrackingMessage(CsfloatTrackingState.INACTIVE))
        assertEquals(
            "CSFloat tracking: unknown; inspect the official popup.",
            csfloatTrackingMessage(CsfloatTrackingState.UNKNOWN),
        )
        assertEquals(
            "CSFloat tracking: failed; retry inspection.",
            csfloatTrackingMessage(CsfloatTrackingState.FAILED),
        )
    }

    @Test
    fun popupStateNeverClaimsTrackingIsActive() {
        val popup = CsfloatPopupStatus()
        assertEquals(CsfloatPopupState.UNAVAILABLE, popup.state)
        popup.available()
        assertEquals(CsfloatPopupState.AVAILABLE, popup.state)
        val request = popup.requestOpen {}
        assertTrue(popup.opened(request))
        assertEquals(CsfloatPopupState.OPENED, popup.state)
        assertFalse(CsfloatPopupState.entries.any { it.name == "ACTIVE" })
    }

    @Test
    fun productionContractPinsTheReviewedOfficialPackage() {
        assertEquals(
            "https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi",
            CsfloatExtensionContract.XPI_URL,
        )
        assertEquals("{194d0dc6-7ada-41c6-88b8-95d7636fe43c}", CsfloatExtensionContract.ID)
        assertEquals("5.17.0", CsfloatExtensionContract.VERSION)
        assertEquals(2, CsfloatExtensionContract.SIGNED_STATE)
        assertEquals(
            "70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D",
            CsfloatExtensionContract.SHA256,
        )
        assertTrue(CsfloatExtensionContract.isExpected(CsfloatExtensionContract.ID, "5.17.0", 2))
        assertFalse(CsfloatExtensionContract.isExpected(CsfloatExtensionContract.ID, "5.17.1", 2))
    }

    @Test
    fun promptPreservesEveryCallbackItemVerbatim() {
        assertEquals(
            """Extension: CSFloat Market Checker
ID: {194d0dc6-7ada-41c6-88b8-95d7636fe43c}
Version: 5.17.0
Permissions (2):
• storage
• alarms
Origins (2):
• *://*.steampowered.com/*
• https://csfloat.com/*
Data collection (1):
• authenticationInfo""",
            CsfloatExtensionContract.prompt(
                "CSFloat Market Checker",
                CsfloatExtensionContract.ID,
                CsfloatExtensionContract.VERSION,
                listOf("storage", "alarms"),
                listOf("*://*.steampowered.com/*", "https://csfloat.com/*"),
                listOf("authenticationInfo"),
            ),
        )
    }

    @Test
    fun artifactAndPopupRejectEveryReviewedMetadataMismatch() {
        assertTrue(CsfloatExtensionContract.artifactMatches(7_011_169, CsfloatExtensionContract.SHA256))
        assertFalse(CsfloatExtensionContract.artifactMatches(7_011_168, CsfloatExtensionContract.SHA256))
        assertFalse(CsfloatExtensionContract.artifactMatches(7_011_169, "00"))
        assertTrue(CsfloatExtensionContract.canOpenOfficialPopup(CsfloatExtensionContract.ID, "5.17.0", 2, true))
        assertFalse(CsfloatExtensionContract.canOpenOfficialPopup(CsfloatExtensionContract.ID, "5.17.0", 2, false))
        assertFalse(CsfloatExtensionContract.canOpenOfficialPopup("other", "5.17.0", 2, true))
        assertFalse(CsfloatExtensionContract.canOpenOfficialPopup(CsfloatExtensionContract.ID, "5.17.1", 2, true))
        assertFalse(CsfloatExtensionContract.canOpenOfficialPopup(CsfloatExtensionContract.ID, "5.17.0", 0, true))
    }

    @Test
    fun officialPopupUriAcceptsOnlyAnExtensionOriginRoot() {
        assertEquals(
            "moz-extension://installed-csfloat/src/popup.html",
            CsfloatExtensionContract.officialPopupUri("moz-extension://installed-csfloat/"),
        )
        assertEquals(null, CsfloatExtensionContract.officialPopupUri(null))
        assertEquals(null, CsfloatExtensionContract.officialPopupUri(""))
        assertEquals(null, CsfloatExtensionContract.officialPopupUri("https://example.invalid/"))
        assertEquals(null, CsfloatExtensionContract.officialPopupUri("moz-extension://installed/other/"))
        assertEquals(null, CsfloatExtensionContract.officialPopupUri("moz-extension://installed/?redirect=evil"))
    }

    @Test
    fun denialMessagesDistinguishSafeAndFailClosedOutcomes() {
        assertEquals(
            "CSFloat: consent denied; extension absent; browsing remains available.",
            csfloatDenialMessage(CsfloatDenialState.ABSENT),
        )
        assertEquals(
            "CSFloat: consent denied; extension disabled; browsing remains available.",
            csfloatDenialMessage(CsfloatDenialState.DISABLED),
        )
        assertTrue(csfloatDenialMessage(CsfloatDenialState.ENABLED).contains("it was removed"))
        assertTrue(csfloatDenialMessage(CsfloatDenialState.QUERY_FAILED).contains("could not be verified"))
    }

    @Test
    fun popupRequiresCurrentRequestBeforeReportingOpened() {
        val popup = CsfloatPopupStatus()
        popup.available()
        val request = popup.requestOpen {}
        assertFalse(popup.opened(request?.plus(1)))
        assertEquals(request, popup.pendingRequest)
        assertTrue(popup.opened(request))
        assertEquals(CsfloatPopupState.OPENED, popup.state)
    }

    @Test
    fun popupFailureRecoversWithoutAcceptingStaleCallbacks() {
        val popup = CsfloatPopupStatus()
        popup.available()
        val failedRequest = popup.requestOpen {}
        assertTrue(popup.failed(failedRequest))
        assertEquals(CsfloatPopupState.FAILED, popup.state)
        assertFalse(popup.opened(failedRequest))
        popup.recover()
        assertEquals(CsfloatPopupState.UNAVAILABLE, popup.state)
        popup.available()
        val current = popup.requestOpen {}
        assertFalse(popup.opened(failedRequest))
        assertTrue(popup.opened(current))
    }
}

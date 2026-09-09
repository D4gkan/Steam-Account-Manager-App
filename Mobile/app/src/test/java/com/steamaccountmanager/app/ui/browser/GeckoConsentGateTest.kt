package com.steamaccountmanager.app.ui.browser

import com.steamaccountmanager.app.persistDetectorConsentFailClosed
import com.steamaccountmanager.app.tryPersistCsfloatQuarantine
import com.steamaccountmanager.app.isCsfloatQuarantined
import com.steamaccountmanager.app.ui.browser.csfloatInstallEnabled
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

class GeckoConsentGateTest {

    @Test
    fun failedOrThrowingQuarantinePersistenceStaysClosed() {
        assertFalse(tryPersistCsfloatQuarantine { false })
        assertFalse(tryPersistCsfloatQuarantine { throw IllegalStateException("synthetic failure") })
        assertFalse(tryPersistCsfloatQuarantine { throw IOException("synthetic I/O failure") })
    }

    @Test
    fun missingTrustedMarkerDefaultsToQuarantine() {
        assertTrue(isCsfloatQuarantined(trustedMarkerExists = false))
        assertFalse(isCsfloatQuarantined(trustedMarkerExists = true))
    }

    @Test
    fun installRemainsDisabledUntilStartupTrustInspectionCompletes() {
        assertFalse(csfloatInstallEnabled(trustInspectionComplete = false, quarantined = false))
        assertFalse(csfloatInstallEnabled(trustInspectionComplete = true, quarantined = true))
        assertTrue(csfloatInstallEnabled(trustInspectionComplete = true, quarantined = false))
    }

    @Test
    fun failedPersistenceKeepsConsentGateClosed() {
        assertFalse(tryPersistDetectorConsent { false })
    }

    @Test
    fun successfulPersistenceAllowsConsentGateToOpen() {
        assertTrue(tryPersistDetectorConsent { true })
    }

    @Test
    fun failedPersistenceRollsBackCachedConsent() {
        var rollbackCount = 0

        assertFalse(
            persistDetectorConsentFailClosed(
                persist = { false },
                rollbackInMemory = { rollbackCount += 1 },
                onRollbackFailure = {},
            ),
        )
        assertEquals(1, rollbackCount)
    }

    @Test
    fun successfulPersistenceDoesNotRollBackCachedConsent() {
        var rollbackCount = 0

        assertTrue(
            persistDetectorConsentFailClosed(
                persist = { true },
                rollbackInMemory = { rollbackCount += 1 },
                onRollbackFailure = {},
            ),
        )
        assertEquals(0, rollbackCount)
    }

    @Test
    fun throwingPersistenceRollsBackAndDoesNotAuthorize() {
        var rolledBack = false

        assertFalse(
            persistDetectorConsentFailClosed(
                persist = { throw IllegalStateException("synthetic persistence failure") },
                rollbackInMemory = { rolledBack = true },
                onRollbackFailure = {},
            ),
        )
        assertTrue(rolledBack)
    }

    @Test
    fun throwingRollbackInvokesFailClosedFallbackAndDoesNotAuthorize() {
        var fallbackInvoked = false

        assertFalse(
            persistDetectorConsentFailClosed(
                persist = { false },
                rollbackInMemory = { throw IllegalStateException("synthetic rollback failure") },
                onRollbackFailure = { fallbackInvoked = true },
            ),
        )
        assertTrue(fallbackInvoked)
    }
}

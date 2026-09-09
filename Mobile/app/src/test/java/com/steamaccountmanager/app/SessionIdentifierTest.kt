package com.steamaccountmanager.app

import com.steamaccountmanager.app.domain.model.SessionIdentifier
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

/**
 * These tests exercise the identifier math behind session isolation directly.
 * They don't touch the Android browser engine (that requires an instrumented test / a real
 * device, see androidTest), but they pin down the invariant everything else
 * depends on: distinct (account, website) pairs must always resolve to distinct,
 * stable identifiers, and the same pair must always resolve to the same identifier
 * so its persistent Gecko profile is found again later.
 */
class SessionIdentifierTest {

    @Test
    fun `same account and website always produces the same suffix`() {
        val a = SessionIdentifier("ow", "steam")
        val b = SessionIdentifier("ow", "steam")
        assertEquals(a.dataDirectorySuffix, b.dataDirectorySuffix)
    }

    @Test
    fun `different accounts on the same website produce different suffixes`() {
        val ow = SessionIdentifier("ow", "steam")
        val crane = SessionIdentifier("crane", "steam")
        val bear = SessionIdentifier("bear", "steam")
        assertNotEquals(ow.dataDirectorySuffix, crane.dataDirectorySuffix)
        assertNotEquals(ow.dataDirectorySuffix, bear.dataDirectorySuffix)
        assertNotEquals(crane.dataDirectorySuffix, bear.dataDirectorySuffix)
    }

    @Test
    fun `same account on different websites produce different suffixes`() {
        val owSteam = SessionIdentifier("ow", "steam")
        val owCsfloat = SessionIdentifier("ow", "csfloat")
        val owCsmoney = SessionIdentifier("ow", "csmoney")
        assertNotEquals(owSteam.dataDirectorySuffix, owCsfloat.dataDirectorySuffix)
        assertNotEquals(owSteam.dataDirectorySuffix, owCsmoney.dataDirectorySuffix)
        assertNotEquals(owCsfloat.dataDirectorySuffix, owCsmoney.dataDirectorySuffix)
    }

    @Test
    fun `the full acceptance-test matrix has no suffix collisions`() {
        // Section 38's acceptance test: OW, CRANE, BEAR each across 4 websites.
        val accounts = listOf("ow", "crane", "bear")
        val websites = listOf("steam", "csfloat", "csmoney", "skins_com")
        val suffixes = accounts.flatMap { accountId ->
            websites.map { websiteId -> SessionIdentifier(accountId, websiteId).dataDirectorySuffix }
        }
        assertEquals("Expected 12 unique suffixes for 3 accounts x 4 websites", 12, suffixes.toSet().size)
    }

    @Test
    fun `suffix round-trips back to the original identifier`() {
        val original = SessionIdentifier("ow", "csfloat")
        val parsed = SessionIdentifier.fromSuffix(original.dataDirectorySuffix)
        assertEquals(original, parsed)
    }

    @Test
    fun `ids with unsafe characters are sanitized but remain distinct`() {
        val a = SessionIdentifier("uuid-with-dash-1234", "steam")
        val b = SessionIdentifier("uuid-with-dash-5678", "steam")
        assertNotEquals(a.dataDirectorySuffix, b.dataDirectorySuffix)
    }
}

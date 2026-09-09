package com.steamaccountmanager.app.browser

import org.junit.Assert.*
import org.junit.Test

class BrowserExtensionPackagesTest {
    @Test
    fun pinnedPackagesCannotBeSubstitutedAcrossWebsites() {
        val packages = listOf(CsfloatExtensionContract, BrowserExtensionPackages.CSMONEY, BrowserExtensionPackages.SKINS)
        assertSame(CsfloatExtensionContract, BrowserExtensionPackages.forWebsite("steam"))
        assertSame(CsfloatExtensionContract, BrowserExtensionPackages.forWebsite("csfloat"))
        assertSame(BrowserExtensionPackages.CSMONEY, BrowserExtensionPackages.forWebsite("csmoney"))
        assertSame(BrowserExtensionPackages.SKINS, BrowserExtensionPackages.forWebsite("skins_com"))
        assertNull(BrowserExtensionPackages.forWebsite("csgoempire"))
        assertNull(BrowserExtensionPackages.forWebsite("custom_https"))
        packages.forEach { expected ->
            assertTrue(expected.isExpected(expected.ID, expected.VERSION, 2))
            assertFalse(expected.isExpected(expected.ID, expected.VERSION, 0))
            assertFalse(expected.isExpected(expected.ID, "unreviewed", 2))
            assertFalse(expected.artifactMatches(expected.SIZE_BYTES + 1, expected.SHA256))
            assertFalse(expected.artifactMatches(expected.SIZE_BYTES, "unreviewed"))
            packages.filter { it !== expected }.forEach { other ->
                assertFalse(expected.isExpected(other.ID, other.VERSION, 2))
            }
            assertNotNull(expected.officialPopupUri("moz-extension://reviewed/"))
            assertNull(expected.officialPopupUri("https://reviewed/"))
            assertNull(expected.officialPopupUri("moz-extension://user@reviewed/"))
        }
    }
}

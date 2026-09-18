package com.steamaccountmanager.app.browser

import org.junit.Assert.*
import org.junit.Test

class CsfloatBrowserCompatibilityTest {
    @Test
    fun `touch device passes CSFloat desktop eligibility while retaining Firefox identity`() {
        val original = "Mozilla/5.0 (Android 16; Mobile; rv:153.0) Gecko/153.0 Firefox/153.0"
        val agent = requireNotNull(csfloatUserAgentOverride("csfloat", original))
        // CSFloat's isAndroidOnDesktopMode rejects touch + Linux x86_64.
        val maxTouchPoints = 5
        assertFalse(maxTouchPoints > 0 && agent.lowercase().contains("linux x86_64"))
        assertFalse(agent.lowercase().contains("android"))
        assertFalse(agent.contains("Mobile"))
        assertTrue(agent.contains("Firefox/153.0"))
        assertTrue(agent.contains("rv:153.0"))
    }

    @Test
    fun `runtime upgrades supply their own version`() {
        val agent = csfloatUserAgentOverride("csfloat", "Mozilla/5.0 (Android 17; rv:160.0) Gecko/160.0 Firefox/160.0")!!
        assertTrue(agent.contains("rv:160.0"))
        assertTrue(agent.endsWith("Firefox/160.0"))
    }

    @Test
    fun `other website sessions and unknown engines keep default identity`() {
        for (site in listOf("steam", "csmoney", "skins_com", "custom_https")) {
            assertNull(csfloatUserAgentOverride(site, "(rv:153.0) Firefox/153.0"))
        }
        assertNull(csfloatUserAgentOverride("csfloat", "unknown"))
    }
}

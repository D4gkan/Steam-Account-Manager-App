package com.steamaccountmanager.app

import com.steamaccountmanager.app.browser.GeckoProfileIdentity
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class BrowserActivityTest {
    @Test
    fun `every supported website receives an isolated Gecko profile`() {
        val websiteIds = listOf("steam", "csfloat", "csmoney", "skins_com", "csgoempire", "custom_https")
        val identities = websiteIds.map { GeckoProfileIdentity.idFor(SessionIdentifier("account-a", it)) }

        assertTrue(identities.all { it.startsWith("gv_") })
        assertTrue(identities.none { it.startsWith("webview_") })
        assertTrue(identities.size == identities.toSet().size)
        assertNotEquals(
            GeckoProfileIdentity.idFor(SessionIdentifier("account-a", "steam")),
            GeckoProfileIdentity.idFor(SessionIdentifier("account-b", "steam")),
        )
    }

    @Test
    fun `only Steam enables detector consent and CSFloat controls`() {
        assertTrue(usesSteamBrowserFeatures("steam"))
        listOf("csfloat", "csmoney", "skins_com", "csgoempire", "custom_https").forEach {
            assertFalse(usesSteamBrowserFeatures(it))
        }
    }
}

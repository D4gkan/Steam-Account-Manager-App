package com.steamaccountmanager.app

import com.steamaccountmanager.app.browser.WebsitePolicy
import com.steamaccountmanager.app.browser.WebsitePolicy.NavigationDecision
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WebsitePolicyTest {

    private val csfloatPolicy = WebsitePolicy(
        primaryDomain = "csfloat.com",
        allowedAuthDomains = listOf("steamcommunity.com", "login.steampowered.com", "csgofloat.com"),
    )

    @Test
    fun `allows the primary domain and its subdomains`() {
        assertTrue(csfloatPolicy.isHostAllowed("csfloat.com"))
        assertTrue(csfloatPolicy.isHostAllowed("www.csfloat.com"))
        assertTrue(csfloatPolicy.isHostAllowed("api.csfloat.com"))
    }

    @Test
    fun `allows explicitly configured auth domains and redirect aliases for legitimate redirects`() {
        assertTrue(csfloatPolicy.isHostAllowed("steamcommunity.com"))
        assertTrue(csfloatPolicy.isHostAllowed("login.steampowered.com"))
        assertTrue(csfloatPolicy.isHostAllowed("csgofloat.com"))
        assertTrue(csfloatPolicy.isHostAllowed("www.csgofloat.com"))
        assertTrue(WebsitePolicy(
            primaryDomain = "cs.money",
            allowedAuthDomains = listOf("steamcommunity.com", "login.steampowered.com", "dota.trade", "auth.dota.trade"),
        ).isHostAllowed("auth.dota.trade"))
        assertTrue(WebsitePolicy(
            primaryDomain = "csgoempire.com",
            allowedAuthDomains = listOf("steamcommunity.com", "login.steampowered.com", "csgoempirelogin6.com"),
        ).isHostAllowed("www.csgoempirelogin6.com"))
    }

    @Test
    fun `blocks unrelated domains`() {
        assertFalse(csfloatPolicy.isHostAllowed("evil-phishing-site.com"))
        assertFalse(csfloatPolicy.isHostAllowed("csmoney.com"))
        assertFalse(csfloatPolicy.isHostAllowed(null))
    }

    @Test
    fun `does not allow a domain that merely contains the allowed domain as a substring`() {
        // e.g. "notcsfloat.com" or "csfloat.com.evil.com" must NOT be treated as allowed.
        assertFalse(csfloatPolicy.isHostAllowed("notcsfloat.com"))
        assertFalse(csfloatPolicy.isHostAllowed("csfloat.com.evil.com"))
    }

    @Test
    fun `matching is case-insensitive`() {
        assertTrue(csfloatPolicy.isHostAllowed("CSFloat.COM"))
    }

    @Test
    fun `classifies navigation at the browser trust boundary`() {
        assertEquals(NavigationDecision.ALLOW_IN_APP, csfloatPolicy.decideNavigation("https://csfloat.com/inventory"))
        assertEquals(NavigationDecision.ALLOW_IN_APP, csfloatPolicy.decideNavigation("http://login.steampowered.com/openid"))
        assertEquals(NavigationDecision.OFFER_EXTERNAL, csfloatPolicy.decideNavigation("https://example.invalid/path"))
        assertEquals(NavigationDecision.REJECT, csfloatPolicy.decideNavigation("mailto:synthetic@example.invalid"))
        assertEquals(NavigationDecision.REJECT, csfloatPolicy.decideNavigation("intent://synthetic/#Intent;scheme=test;end"))
        assertEquals(NavigationDecision.REJECT, csfloatPolicy.decideNavigation("https://user:secret@csfloat.com/private"))
        assertEquals(NavigationDecision.REJECT, csfloatPolicy.decideNavigation("not a url"))
    }
}

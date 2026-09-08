package com.steamaccountmanager.app.browser

import java.net.URI

/**
 * Restricts navigation for a single browser session to its configured website's
 * domain, plus an explicit allowlist of auth-related domains (e.g. Steam's own
 * login/redirect domains for sites that offer "Sign in through Steam"). Anything
 * else is blocked from loading in-app; the app instead offers to open it in the
 * device's default browser (Section 12 / Section 11: "optional open externally").
 */
class WebsitePolicy(
    private val primaryDomain: String,
    private val allowedAuthDomains: List<String>,
) {
    enum class NavigationDecision { ALLOW_IN_APP, OFFER_EXTERNAL, REJECT }

    private val allDomains: List<String> = (listOf(primaryDomain) + allowedAuthDomains).map { it.lowercase() }

    fun isHostAllowed(host: String?): Boolean {
        val h = host?.lowercase() ?: return false
        return allDomains.any { domain -> h == domain || h.endsWith(".$domain") }
    }

    fun decideNavigation(url: String): NavigationDecision {
        val uri = try {
            URI(url)
        } catch (_: Exception) {
            return NavigationDecision.REJECT
        }
        if (uri.scheme?.lowercase() !in setOf("http", "https") || uri.host == null || uri.rawUserInfo != null) {
            return NavigationDecision.REJECT
        }
        return if (isHostAllowed(uri.host)) NavigationDecision.ALLOW_IN_APP else NavigationDecision.OFFER_EXTERNAL
    }
}

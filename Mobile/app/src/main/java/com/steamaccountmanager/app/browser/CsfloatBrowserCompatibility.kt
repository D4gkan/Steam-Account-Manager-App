package com.steamaccountmanager.app.browser

/**
 * CSFloat rejects Linux desktop Firefox with touch input as Android desktop mode,
 * even when its official extension is installed. Keep Firefox's real engine version
 * and touch support, but use the Windows desktop identity in CSFloat sessions.
 */
internal fun csfloatUserAgentOverride(websiteId: String, defaultUserAgent: String): String? {
    if (websiteId != "csfloat") return null
    val engineVersion = Regex("rv:([0-9.]+)").find(defaultUserAgent)?.groupValues?.get(1) ?: return null
    val firefoxVersion = Regex("Firefox/([0-9.]+)").find(defaultUserAgent)?.groupValues?.get(1) ?: return null
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:$engineVersion) Gecko/20100101 Firefox/$firefoxVersion"
}

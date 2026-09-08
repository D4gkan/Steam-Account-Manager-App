package com.steamaccountmanager.app.domain.model

/**
 * Identifies exactly one isolated browser session: one account, on one website.
 *
 * This is the unit of isolation everywhere in the app -- NOT the account alone.
 * [com.steamaccountmanager.app.browser.GeckoProfileIdentity] maps it to an opaque,
 * persistent Gecko profile directory.
 */
data class SessionIdentifier(
    val accountId: String,
    val websiteId: String,
) {
    /**
     * Stable metadata key retained for existing database rows. Gecko profile paths use
     * [com.steamaccountmanager.app.browser.GeckoProfileIdentity] instead.
     */
    val dataDirectorySuffix: String
        get() = "acc_${sanitize(accountId)}_site_${sanitize(websiteId)}"

    private fun sanitize(value: String): String =
        value.filter { it.isLetterOrDigit() || it == '_' || it == '-' }.take(48)

    companion object {
        fun fromSuffix(suffix: String): SessionIdentifier? {
            val regex = Regex("^acc_(.+)_site_(.+)$")
            val match = regex.find(suffix) ?: return null
            val (accountId, websiteId) = match.destructured
            return SessionIdentifier(accountId, websiteId)
        }
    }
}

/** Persisted metadata about a session (not the session's cookies/storage themselves). */
data class WebsiteSessionMeta(
    val accountId: String,
    val websiteId: String,
    val createdAtEpochMillis: Long,
    val lastUsedAtEpochMillis: Long,
    /** True once persistent browser data for this session has actually been created. */
    val hasStoredData: Boolean,
)

package com.steamaccountmanager.app.domain.model

/**
 * A user-managed "identity" in the app (e.g. "OW", "CRANE", "BEAR").
 *
 * This is deliberately independent of any single website. It groups together a
 * set of per-website sessions (see [com.steamaccountmanager.app.domain.model.WebsiteSession]).
 */
data class Account(
    val id: String,
    val displayName: String,
    val steamProfileId: String? = null,
    val avatarUrl: String? = null,
    val sortOrder: Int,
    val createdAtEpochMillis: Long,
    val lastUsedAtEpochMillis: Long? = null,
)

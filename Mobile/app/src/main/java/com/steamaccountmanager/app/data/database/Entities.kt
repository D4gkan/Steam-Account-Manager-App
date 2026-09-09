package com.steamaccountmanager.app.data.database

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Non-sensitive account metadata only. No credentials live here -- see
 * data.securestorage.SecureCredentialStore for the encrypted Steam-password vault.
 */
@Entity(tableName = "accounts")
data class AccountEntity(
    @PrimaryKey val id: String,
    val displayName: String,
    val steamProfileId: String?,
    val avatarUrl: String?,
    val sortOrder: Int,
    val createdAtEpochMillis: Long,
    val lastUsedAtEpochMillis: Long?,
)

@Entity(tableName = "websites")
data class WebsiteEntity(
    @PrimaryKey val id: String,
    val name: String,
    val url: String,
    val domain: String,
    /** Comma-separated list; small enough that a TypeConverter/list column isn't worth it. */
    val allowedAuthDomainsCsv: String,
    val iconRes: String?,
    val isBuiltIn: Boolean,
    val isEnabled: Boolean,
    val sortOrder: Int,
)

/**
 * Metadata ONLY about an account+website session pairing -- e.g. "does this pairing
 * have persistent browser data on disk, and when was it last opened". The actual
 * cookies/localStorage/IndexedDB live inside the session's Gecko profile,
 * managed directly by GeckoView, never in this table.
 */
@Entity(
    tableName = "account_website_sessions",
    primaryKeys = ["accountId", "websiteId"],
    foreignKeys = [
        ForeignKey(
            entity = AccountEntity::class,
            parentColumns = ["id"],
            childColumns = ["accountId"],
            onDelete = ForeignKey.CASCADE,
        ),
        ForeignKey(
            entity = WebsiteEntity::class,
            parentColumns = ["id"],
            childColumns = ["websiteId"],
            onDelete = ForeignKey.CASCADE,
        ),
    ],
    indices = [Index("accountId"), Index("websiteId")],
)
data class AccountWebsiteSessionEntity(
    val accountId: String,
    val websiteId: String,
    val sessionIdentifier: String,
    val createdAtEpochMillis: Long,
    val lastUsedAtEpochMillis: Long,
    val hasStoredData: Boolean,
)

@Entity(tableName = "app_settings")
data class AppSettingsEntity(
    @PrimaryKey val key: String,
    val value: String,
)

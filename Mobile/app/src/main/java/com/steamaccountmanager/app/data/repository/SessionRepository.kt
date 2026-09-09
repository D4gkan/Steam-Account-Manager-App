package com.steamaccountmanager.app.data.repository

import com.steamaccountmanager.app.data.database.AccountWebsiteSessionEntity
import com.steamaccountmanager.app.data.database.dao.SessionDao
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import com.steamaccountmanager.app.domain.model.WebsiteSessionMeta

/**
 * Tracks metadata about which (account, website) pairs have ever been opened --
 * NOT the session data itself, which lives in GeckoView's own per-profile
 * data directory (see browser/BrowserProcessController). Used purely so the UI can
 * show "Session ready" vs. "Not signed in yet" without touching the browser layer.
 */
class SessionRepository(private val sessionDao: SessionDao) {

    suspend fun getMeta(sessionId: SessionIdentifier): WebsiteSessionMeta? =
        sessionDao.get(sessionId.accountId, sessionId.websiteId)?.toDomain()

    suspend fun recordSessionOpened(sessionId: SessionIdentifier) {
        val existing = sessionDao.get(sessionId.accountId, sessionId.websiteId)
        val now = System.currentTimeMillis()
        if (existing == null) {
            sessionDao.upsert(
                AccountWebsiteSessionEntity(
                    accountId = sessionId.accountId,
                    websiteId = sessionId.websiteId,
                    sessionIdentifier = sessionId.dataDirectorySuffix,
                    createdAtEpochMillis = now,
                    lastUsedAtEpochMillis = now,
                    hasStoredData = true,
                ),
            )
        } else {
            sessionDao.markUsed(sessionId.accountId, sessionId.websiteId, now)
        }
    }
}

private fun AccountWebsiteSessionEntity.toDomain() = WebsiteSessionMeta(
    accountId = accountId,
    websiteId = websiteId,
    createdAtEpochMillis = createdAtEpochMillis,
    lastUsedAtEpochMillis = lastUsedAtEpochMillis,
    hasStoredData = hasStoredData,
)

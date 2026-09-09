package com.steamaccountmanager.app.data.repository

import com.steamaccountmanager.app.data.database.AccountEntity
import com.steamaccountmanager.app.data.database.dao.AccountDao
import com.steamaccountmanager.app.domain.model.Account
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

class AccountRepository(private val accountDao: AccountDao) {

    fun observeAccounts(): Flow<List<Account>> =
        accountDao.observeAll().map { entities -> entities.map { it.toDomain() } }

    suspend fun getAccount(id: String): Account? = accountDao.getById(id)?.toDomain()

    suspend fun createAccount(displayName: String): Account {
        val nextSortOrder = accountDao.nextSortOrder()
        val account = AccountEntity(
            id = UUID.randomUUID().toString(),
            displayName = displayName.trim(),
            steamProfileId = null,
            avatarUrl = null,
            sortOrder = nextSortOrder,
            createdAtEpochMillis = System.currentTimeMillis(),
            lastUsedAtEpochMillis = null,
        )
        accountDao.upsert(account)
        return account.toDomain()
    }

    suspend fun renameAccount(id: String, newName: String) {
        accountDao.rename(id, newName.trim())
    }

    suspend fun deleteAccount(account: Account) {
        accountDao.delete(account.toEntity())
    }

    suspend fun reorder(orderedIds: List<String>) {
        accountDao.reorder(orderedIds)
    }

    suspend fun touchLastUsed(id: String) {
        accountDao.touchLastUsed(id, System.currentTimeMillis())
    }

    suspend fun updateSteamProfile(id: String, avatarUrl: String?, steamProfileId: String?) {
        accountDao.updateSteamProfile(id, avatarUrl, steamProfileId)
    }
}

private fun AccountEntity.toDomain() = Account(
    id = id,
    displayName = displayName,
    steamProfileId = steamProfileId,
    avatarUrl = avatarUrl,
    sortOrder = sortOrder,
    createdAtEpochMillis = createdAtEpochMillis,
    lastUsedAtEpochMillis = lastUsedAtEpochMillis,
)

private fun Account.toEntity() = AccountEntity(
    id = id,
    displayName = displayName,
    steamProfileId = steamProfileId,
    avatarUrl = avatarUrl,
    sortOrder = sortOrder,
    createdAtEpochMillis = createdAtEpochMillis,
    lastUsedAtEpochMillis = lastUsedAtEpochMillis,
)

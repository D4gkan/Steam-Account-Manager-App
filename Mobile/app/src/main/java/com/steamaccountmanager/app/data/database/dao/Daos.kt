package com.steamaccountmanager.app.data.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import androidx.room.Transaction
import com.steamaccountmanager.app.data.database.AccountEntity
import com.steamaccountmanager.app.data.database.AccountWebsiteSessionEntity
import com.steamaccountmanager.app.data.database.AppSettingsEntity
import com.steamaccountmanager.app.data.database.WebsiteEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AccountDao {
    @Query("SELECT * FROM accounts ORDER BY sortOrder ASC")
    fun observeAll(): Flow<List<AccountEntity>>

    @Query("SELECT * FROM accounts WHERE id = :id")
    suspend fun getById(id: String): AccountEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(account: AccountEntity)

    @Update
    suspend fun update(account: AccountEntity)

    @Query("UPDATE accounts SET displayName = :name WHERE id = :id")
    suspend fun rename(id: String, name: String)

    @Delete
    suspend fun delete(account: AccountEntity)

    @Query("UPDATE accounts SET sortOrder = :sortOrder WHERE id = :id")
    suspend fun updateSortOrder(id: String, sortOrder: Int)

    @Transaction
    suspend fun reorder(orderedIds: List<String>) {
        orderedIds.forEachIndexed { index, id -> updateSortOrder(id, index) }
    }

    @Query("UPDATE accounts SET lastUsedAtEpochMillis = :timestamp WHERE id = :id")
    suspend fun touchLastUsed(id: String, timestamp: Long)

    @Query("UPDATE accounts SET avatarUrl = :avatarUrl, steamProfileId = :steamProfileId WHERE id = :id")
    suspend fun updateSteamProfile(id: String, avatarUrl: String?, steamProfileId: String?)

    @Query("SELECT COALESCE(MAX(sortOrder), -1) + 1 FROM accounts")
    suspend fun nextSortOrder(): Int
}

@Dao
interface WebsiteDao {
    @Query("SELECT * FROM websites ORDER BY sortOrder ASC")
    fun observeAll(): Flow<List<WebsiteEntity>>

    @Query("SELECT * FROM websites WHERE isEnabled = 1 ORDER BY sortOrder ASC")
    fun observeEnabled(): Flow<List<WebsiteEntity>>

    @Query("SELECT * FROM websites WHERE id = :id")
    suspend fun getById(id: String): WebsiteEntity?

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertIfAbsent(website: WebsiteEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(website: WebsiteEntity)

    @Update
    suspend fun update(website: WebsiteEntity)

    @Delete
    suspend fun delete(website: WebsiteEntity)

    @Query("SELECT COUNT(*) FROM websites WHERE domain = :domain")
    suspend fun countByDomain(domain: String): Int
}

@Dao
interface SessionDao {
    @Query("SELECT * FROM account_website_sessions WHERE accountId = :accountId AND websiteId = :websiteId")
    suspend fun get(accountId: String, websiteId: String): AccountWebsiteSessionEntity?

    @Query("SELECT * FROM account_website_sessions WHERE accountId = :accountId")
    fun observeForAccount(accountId: String): Flow<List<AccountWebsiteSessionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(session: AccountWebsiteSessionEntity)

    @Query("UPDATE account_website_sessions SET lastUsedAtEpochMillis = :timestamp, hasStoredData = 1 WHERE accountId = :accountId AND websiteId = :websiteId")
    suspend fun markUsed(accountId: String, websiteId: String, timestamp: Long)

    @Query("DELETE FROM account_website_sessions WHERE accountId = :accountId AND websiteId = :websiteId")
    suspend fun clear(accountId: String, websiteId: String)
}

@Dao
interface AppSettingsDao {
    @Query("SELECT * FROM app_settings WHERE key = :key")
    suspend fun get(key: String): AppSettingsEntity?

    @Query("SELECT * FROM app_settings WHERE key = :key")
    fun observe(key: String): Flow<AppSettingsEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun set(setting: AppSettingsEntity)
}

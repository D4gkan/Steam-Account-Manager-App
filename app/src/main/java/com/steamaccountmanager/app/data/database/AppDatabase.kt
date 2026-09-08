package com.steamaccountmanager.app.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.steamaccountmanager.app.data.database.dao.AccountDao
import com.steamaccountmanager.app.data.database.dao.AppSettingsDao
import com.steamaccountmanager.app.data.database.dao.SessionDao
import com.steamaccountmanager.app.data.database.dao.WebsiteDao

/**
 * Structured, non-sensitive application data ONLY: accounts, website definitions,
 * and session *metadata* (which pairings exist, when they were last used).
 *
 * Deliberately does NOT store: Steam passwords, cookies, tokens, or any browser
 * storage. Those live either in the Android Keystore-backed encrypted store
 * (data.securestorage) or directly inside GeckoView's own per-session
 * data directories, which Room/this database never touches.
 */
@Database(
    entities = [
        AccountEntity::class,
        WebsiteEntity::class,
        AccountWebsiteSessionEntity::class,
        AppSettingsEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun accountDao(): AccountDao
    abstract fun websiteDao(): WebsiteDao
    abstract fun sessionDao(): SessionDao
    abstract fun appSettingsDao(): AppSettingsDao

    companion object {
        private const val DB_NAME = "steam_account_manager.db"

        @Volatile private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    DB_NAME,
                ).build().also { instance = it }
            }
    }
}

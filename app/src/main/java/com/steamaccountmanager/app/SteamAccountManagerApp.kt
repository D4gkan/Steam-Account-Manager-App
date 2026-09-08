package com.steamaccountmanager.app

import android.app.Application
import com.steamaccountmanager.app.data.database.AppDatabase
import com.steamaccountmanager.app.data.repository.AccountRepository
import com.steamaccountmanager.app.data.repository.SessionRepository
import com.steamaccountmanager.app.data.repository.WebsiteRepository
import com.steamaccountmanager.app.data.securestorage.SecureCredentialStore
import com.steamaccountmanager.app.security.PinManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * A small hand-rolled service container rather than a DI framework (Hilt/Koin).
 * The dependency graph here is shallow enough (a handful of repositories over one
 * Room database plus one encrypted preference file) that a framework would add
 * more build-time/dependency-tree cost than it would save -- consistent with the
 * "avoid unnecessary dependencies" guidance. If the app grows substantially,
 * migrating this to Hilt would be a reasonable follow-up.
 *
 * NOTE: This Application class is also instantiated in the `:browser` process
 * (every process running any part of this app gets its own Application instance).
 * Everything constructed here must be safe to exist in a process that will only
 * ever host a single browser profile and nothing else -- which the objects below are.
 */
class SteamAccountManagerApp : Application() {

    lateinit var database: AppDatabase
        private set
    lateinit var accountRepository: AccountRepository
        private set
    lateinit var websiteRepository: WebsiteRepository
        private set
    lateinit var sessionRepository: SessionRepository
        private set
    lateinit var secureCredentialStore: SecureCredentialStore
        private set
    lateinit var pinManager: PinManager
        private set

    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /** Reset to false every time this process is created; set true once the user
     *  has passed AppLockActivity for the current process lifetime. Deliberately
     *  in-memory only -- there is no reason to persist "unlocked" state to disk. */
    var unlockedForProcess: Boolean = false

    override fun onCreate() {
        super.onCreate()
        database = AppDatabase.getInstance(this)
        accountRepository = AccountRepository(database.accountDao())
        websiteRepository = WebsiteRepository(database.websiteDao())
        sessionRepository = SessionRepository(database.sessionDao())
        secureCredentialStore = SecureCredentialStore(this)
        pinManager = PinManager(secureCredentialStore)

        if (!isBrowserProcess()) {
            applicationScope.launch { websiteRepository.seedBuiltInsIfNeeded() }
        }
    }

    private fun isBrowserProcess(): Boolean {
        val processName = getProcessNameCompat()
        return processName != null && processName.endsWith(":browser")
    }

    private fun getProcessNameCompat(): String? = try {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            android.app.Application.getProcessName()
        } else {
            null
        }
    } catch (_: Throwable) {
        null
    }
}

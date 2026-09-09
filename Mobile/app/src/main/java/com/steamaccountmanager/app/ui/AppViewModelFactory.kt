package com.steamaccountmanager.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.steamaccountmanager.app.SteamAccountManagerApp
import com.steamaccountmanager.app.ui.account.AddAccountViewModel
import com.steamaccountmanager.app.ui.account.WebsiteSelectionViewModel
import com.steamaccountmanager.app.ui.home.HomeViewModel
import com.steamaccountmanager.app.ui.settings.SettingsViewModel

/** One small factory for every screen ViewModel, backed by the app's manual DI container. */
class AppViewModelFactory(
    private val app: SteamAccountManagerApp,
    private val accountIdForWebsiteSelection: String? = null,
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when (modelClass) {
            HomeViewModel::class.java -> HomeViewModel(app.accountRepository) as T
            AddAccountViewModel::class.java -> AddAccountViewModel(app.accountRepository) as T
            WebsiteSelectionViewModel::class.java -> WebsiteSelectionViewModel(
                accountId = requireNotNull(accountIdForWebsiteSelection),
                accountRepository = app.accountRepository,
                websiteRepository = app.websiteRepository,
                sessionRepository = app.sessionRepository,
            ) as T
            SettingsViewModel::class.java -> SettingsViewModel(
                websiteRepository = app.websiteRepository,
                secureCredentialStore = app.secureCredentialStore,
                pinManager = app.pinManager,
            ) as T
            else -> throw IllegalArgumentException("Unknown ViewModel class: $modelClass")
        }
    }
}

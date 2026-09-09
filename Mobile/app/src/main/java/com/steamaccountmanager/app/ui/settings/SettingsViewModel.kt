package com.steamaccountmanager.app.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.steamaccountmanager.app.data.repository.AddWebsiteResult
import com.steamaccountmanager.app.data.repository.WebsiteRepository
import com.steamaccountmanager.app.data.securestorage.SecureCredentialStore
import com.steamaccountmanager.app.domain.model.Website
import com.steamaccountmanager.app.security.PinManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class SettingsUiState(
    val appLockEnabled: Boolean = false,
    val biometricPreferred: Boolean = true,
    val hasPinSet: Boolean = false,
    val websites: List<Website> = emptyList(),
    val addWebsiteError: String? = null,
)

class SettingsViewModel(
    private val websiteRepository: WebsiteRepository,
    private val secureCredentialStore: SecureCredentialStore,
    private val pinManager: PinManager,
) : ViewModel() {

    private val _localFlags = MutableStateFlow(
        Triple(
            secureCredentialStore.isAppLockEnabled(),
            secureCredentialStore.isBiometricPreferred(),
            pinManager.hasPinSet(),
        ),
    )
    private val _addWebsiteError = MutableStateFlow<String?>(null)

    val uiState: StateFlow<SettingsUiState> = combine(
        websiteRepository.observeAllWebsites(),
        _localFlags,
        _addWebsiteError,
    ) { websites, flags, error ->
        SettingsUiState(
            appLockEnabled = flags.first,
            biometricPreferred = flags.second,
            hasPinSet = flags.third,
            websites = websites,
            addWebsiteError = error,
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SettingsUiState())

    fun setAppLockEnabled(enabled: Boolean) {
        secureCredentialStore.setAppLockEnabled(enabled)
        refreshFlags()
    }

    fun setBiometricPreferred(preferred: Boolean) {
        secureCredentialStore.setBiometricPreferred(preferred)
        refreshFlags()
    }

    fun setPin(pin: String) {
        pinManager.setPin(pin)
        refreshFlags()
    }

    fun clearPin() {
        pinManager.clearPin()
        secureCredentialStore.setAppLockEnabled(false)
        refreshFlags()
    }

    fun setWebsiteEnabled(website: Website, enabled: Boolean) {
        viewModelScope.launch { websiteRepository.setEnabled(website.id, enabled) }
    }

    fun addCustomWebsite(name: String, url: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            when (val result = websiteRepository.addCustomWebsite(name, url)) {
                is AddWebsiteResult.Success -> {
                    _addWebsiteError.value = null
                    onSuccess()
                }
                is AddWebsiteResult.Failure -> _addWebsiteError.value = result.reason
            }
        }
    }

    fun deleteCustomWebsite(website: Website) {
        viewModelScope.launch { websiteRepository.deleteCustomWebsite(website) }
    }

    fun clearAddWebsiteError() {
        _addWebsiteError.value = null
    }

    private fun refreshFlags() {
        _localFlags.value = Triple(
            secureCredentialStore.isAppLockEnabled(),
            secureCredentialStore.isBiometricPreferred(),
            pinManager.hasPinSet(),
        )
    }
}

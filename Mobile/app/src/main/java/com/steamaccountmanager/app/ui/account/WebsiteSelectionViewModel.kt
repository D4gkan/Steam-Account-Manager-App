package com.steamaccountmanager.app.ui.account

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.steamaccountmanager.app.browser.BrowserProcessController
import com.steamaccountmanager.app.data.repository.AccountRepository
import com.steamaccountmanager.app.data.repository.SessionRepository
import com.steamaccountmanager.app.data.repository.WebsiteRepository
import com.steamaccountmanager.app.domain.model.Account
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import com.steamaccountmanager.app.domain.model.Website
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class WebsiteSelectionUiState(
    val account: Account? = null,
    val websites: List<Website> = emptyList(),
    val isLoading: Boolean = true,
)

class WebsiteSelectionViewModel(
    private val accountId: String,
    private val accountRepository: AccountRepository,
    private val websiteRepository: WebsiteRepository,
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    val uiState: StateFlow<WebsiteSelectionUiState> = combine(
        kotlinx.coroutines.flow.flow { emit(accountRepository.getAccount(accountId)) },
        websiteRepository.observeEnabledWebsites(),
    ) { account, websites ->
        WebsiteSelectionUiState(account = account, websites = websites, isLoading = false)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), WebsiteSelectionUiState())

    /**
     * Opens the isolated session for (this account, this website). All the actual
     * isolation work happens in [BrowserProcessController] -- this call site never
     * needs to know or care whether the browser process needs to restart.
     */
    fun openWebsite(context: Context, website: Website) {
        val sessionId = SessionIdentifier(accountId, website.id)
        viewModelScope.launch {
            accountRepository.touchLastUsed(accountId)
            sessionRepository.recordSessionOpened(sessionId)
            val allowedDomains = listOf(website.domain) + website.allowedAuthDomains
            BrowserProcessController.openWebsite(
                context = context,
                sessionId = sessionId,
                targetUrl = website.url,
                allowedDomains = allowedDomains,
            )
        }
    }
}

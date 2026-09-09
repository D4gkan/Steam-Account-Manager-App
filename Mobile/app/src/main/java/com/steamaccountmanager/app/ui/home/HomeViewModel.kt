package com.steamaccountmanager.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.steamaccountmanager.app.data.repository.AccountRepository
import com.steamaccountmanager.app.domain.model.Account
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

data class HomeUiState(
    val accounts: List<Account> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
)

class HomeViewModel(private val accountRepository: AccountRepository) : ViewModel() {

    private val _localOrder = MutableStateFlow<List<Account>?>(null)
    private val actionError = MutableStateFlow<String?>(null)
    private val mutations = Mutex()

    val uiState: StateFlow<HomeUiState> = accountRepository.observeAccounts()
        .let { flow ->
            kotlinx.coroutines.flow.combine(flow, _localOrder, actionError) { fromDb, localOverride, error ->
                HomeUiState(accounts = localOverride ?: fromDb, isLoading = false, error = error)
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())

    /** Optimistic local reorder while dragging; committed to Room on drag end. */
    fun moveAccount(fromId: String, to: Int) {
        val current = (_localOrder.value ?: uiState.value.accounts).toMutableList()
        val from = current.indexOfFirst { it.id == fromId }
        if (from < 0 || to !in current.indices || from == to) return
        current.add(to, current.removeAt(from))
        _localOrder.value = current
    }

    fun commitReorder() {
        val orderedIds = _localOrder.value?.map { it.id } ?: return
        changeAccounts("Could not save the new order. Please try again.") {
            accountRepository.reorder(orderedIds)
        }
    }

    fun renameAccount(account: Account, name: String) {
        val trimmed = name.trim()
        if (trimmed.isEmpty()) return
        changeAccounts("Could not rename this account. Please try again.") {
            accountRepository.renameAccount(account.id, trimmed)
        }
    }

    fun deleteAccount(account: Account) {
        changeAccounts("Could not delete this account. Please try again.") {
            accountRepository.deleteAccount(account)
        }
    }

    fun dismissError() { actionError.value = null }

    private fun changeAccounts(message: String, action: suspend () -> Unit) {
        val pendingOrder = _localOrder.value
        viewModelScope.launch {
            mutations.withLock {
                try {
                    action()
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (_: Exception) {
                    actionError.value = message
                } finally {
                    if (_localOrder.value === pendingOrder) _localOrder.value = null
                }
            }
        }
    }
}

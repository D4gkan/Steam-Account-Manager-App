package com.steamaccountmanager.app.ui.account

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.steamaccountmanager.app.data.repository.AccountRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class AddAccountUiState(
    val name: String = "",
    val isCreating: Boolean = false,
    val error: String? = null,
    /** Non-null once the account row exists and the caller should open its Steam session. */
    val createdAccountId: String? = null,
)

class AddAccountViewModel(private val accountRepository: AccountRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(AddAccountUiState())
    val uiState: StateFlow<AddAccountUiState> = _uiState

    fun onNameChange(name: String) {
        _uiState.value = _uiState.value.copy(name = name, error = null)
    }

    /**
     * Creates the account row immediately (Section 5: "Enter account name" ->
     * "Create isolated Steam session"). The actual Steam login happens inside the
     * normal isolated browser session for this account -- we don't collect or see
     * the Steam password ourselves, Steam's own login page does.
     */
    fun createAccount(onCreated: (accountId: String) -> Unit) {
        val trimmed = _uiState.value.name.trim()
        if (trimmed.isEmpty()) {
            _uiState.value = _uiState.value.copy(error = "Please enter a name for this account.")
            return
        }
        if (trimmed.length > 40) {
            _uiState.value = _uiState.value.copy(error = "Name is too long.")
            return
        }
        _uiState.value = _uiState.value.copy(isCreating = true, error = null)
        viewModelScope.launch {
            val account = accountRepository.createAccount(trimmed)
            _uiState.value = _uiState.value.copy(isCreating = false, createdAccountId = account.id)
            onCreated(account.id)
        }
    }
}

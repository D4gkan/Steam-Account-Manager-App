@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.steamaccountmanager.app.ui.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun AddAccountScreen(
    viewModel: AddAccountViewModel,
    onBack: () -> Unit,
    onAccountReadyForSteamLogin: (accountId: String) -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Add Account") },
                navigationIcon = {
                    TextButton(onClick = onBack) { Text("Cancel") }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(24.dp),
            verticalArrangement = Arrangement.Top,
        ) {
            Text(
                "Give this account a name",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                "This is just a label for you -- e.g. \"OW\" or \"Trading\". You'll log into Steam next, in a session that belongs only to this account.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp, bottom = 20.dp),
            )
            OutlinedTextField(
                value = state.name,
                onValueChange = viewModel::onNameChange,
                label = { Text("Account name") },
                singleLine = true,
                isError = state.error != null,
                supportingText = { state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) } },
                modifier = Modifier.fillMaxWidth(),
            )
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(24.dp))
            Button(
                onClick = { viewModel.createAccount(onAccountReadyForSteamLogin) },
                enabled = !state.isCreating && state.name.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.isCreating) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Text("Continue to Steam login")
                }
            }
        }
    }
}

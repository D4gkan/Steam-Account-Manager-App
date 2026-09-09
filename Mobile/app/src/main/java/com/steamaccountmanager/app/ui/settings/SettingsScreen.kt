@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.steamaccountmanager.app.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.steamaccountmanager.app.domain.model.Website
import com.steamaccountmanager.app.ui.theme.SteamTextSecondary

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    var showPinDialog by remember { mutableStateOf(false) }
    var showAddWebsiteDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
            item { SectionHeader("App Lock") }
            item {
                SettingsRow(
                    title = "Require unlock to open app",
                    subtitle = "Use fingerprint or a PIN before showing your accounts.",
                ) {
                    Switch(
                        checked = state.appLockEnabled,
                        onCheckedChange = { enabled ->
                            if (enabled && !state.hasPinSet) {
                                showPinDialog = true
                            } else {
                                viewModel.setAppLockEnabled(enabled)
                            }
                        },
                    )
                }
            }
            if (state.appLockEnabled) {
                item {
                    SettingsRow(title = "Prefer biometrics", subtitle = "Fall back to PIN if unavailable.") {
                        Switch(checked = state.biometricPreferred, onCheckedChange = viewModel::setBiometricPreferred)
                    }
                }
                item {
                    SettingsRow(title = if (state.hasPinSet) "Change PIN" else "Set PIN", subtitle = "Used when biometrics aren't available.") {
                        TextButton(onClick = { showPinDialog = true }) { Text("Edit") }
                    }
                }
            }

            item { SectionHeader("Websites") }
            items(state.websites, key = { it.id }) { website ->
                WebsiteSettingsRow(
                    website = website,
                    onToggle = { enabled -> viewModel.setWebsiteEnabled(website, enabled) },
                    onDelete = { viewModel.deleteCustomWebsite(website) },
                )
            }
            item {
                TextButton(onClick = { showAddWebsiteDialog = true }) { Text("+ Add custom website") }
            }

            item { SectionHeader("Backup") }
            item {
                Text(
                    "Account names, ordering, and website settings are backed up automatically by Android. Steam passwords, cookies, and login sessions are never included in backups -- you'll need to sign in again on a new device.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SteamTextSecondary,
                    modifier = Modifier.padding(vertical = 8.dp),
                )
            }

            item { SectionHeader("About") }
            item {
                Text(
                    "Steam Account Manager -- a local, offline-first multi-account session manager. No cloud account, no backend, no ads.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = SteamTextSecondary,
                    modifier = Modifier.padding(vertical = 8.dp, ),
                )
            }
            item { androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(24.dp)) }
        }
    }

    if (showPinDialog) {
        PinDialog(
            onDismiss = { showPinDialog = false },
            onConfirm = { pin ->
                viewModel.setPin(pin)
                viewModel.setAppLockEnabled(true)
                showPinDialog = false
            },
        )
    }

    if (showAddWebsiteDialog) {
        AddWebsiteDialog(
            error = state.addWebsiteError,
            onDismiss = {
                showAddWebsiteDialog = false
                viewModel.clearAddWebsiteError()
            },
            onConfirm = { name, url ->
                viewModel.addCustomWebsite(name, url) { showAddWebsiteDialog = false }
            },
        )
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title.uppercase(),
        style = MaterialTheme.typography.labelMedium,
        color = SteamTextSecondary,
        modifier = Modifier.padding(top = 20.dp, bottom = 8.dp),
    )
}

@Composable
private fun SettingsRow(title: String, subtitle: String, trailing: @Composable () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = SteamTextSecondary)
            }
            trailing()
        }
    }
}

@Composable
private fun WebsiteSettingsRow(website: Website, onToggle: (Boolean) -> Unit, onDelete: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(website.name, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(website.domain, style = MaterialTheme.typography.bodyMedium, color = SteamTextSecondary)
            }
            Switch(checked = website.isEnabled, onCheckedChange = onToggle)
            if (!website.isBuiltIn) {
                IconButton(onClick = onDelete) {
                    Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
private fun PinDialog(onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var pin by remember { mutableStateOf("") }
    var confirmPin by remember { mutableStateOf("") }
    val error = pin.length in 1..3 || confirmPin.isNotEmpty() && confirmPin != pin

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Set a PIN") },
        text = {
            Column {
                OutlinedTextField(
                    value = pin,
                    onValueChange = { if (it.length <= 8 && it.all(Char::isDigit)) pin = it },
                    label = { Text("4-8 digit PIN") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                )
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(6.dp))
                OutlinedTextField(
                    value = confirmPin,
                    onValueChange = { if (it.length <= 8 && it.all(Char::isDigit)) confirmPin = it },
                    label = { Text("Confirm PIN") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    isError = confirmPin.isNotEmpty() && confirmPin != pin,
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = pin.length >= 4 && pin == confirmPin,
                onClick = { onConfirm(pin) },
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun AddWebsiteDialog(error: String?, onDismiss: () -> Unit, onConfirm: (name: String, url: String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var url by remember { mutableStateOf("https://") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add custom website") },
        text = {
            Column {
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, singleLine = true)
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.padding(6.dp))
                OutlinedTextField(
                    value = url,
                    onValueChange = { url = it },
                    label = { Text("URL (https://)") },
                    singleLine = true,
                    isError = error != null,
                    supportingText = { error?.let { Text(it, color = MaterialTheme.colorScheme.error) } },
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(name, url) }) { Text("Add") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

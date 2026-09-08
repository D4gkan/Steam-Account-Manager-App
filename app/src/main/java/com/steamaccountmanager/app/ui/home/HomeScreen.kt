@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.steamaccountmanager.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DragHandle
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.steamaccountmanager.app.domain.model.Account
import com.steamaccountmanager.app.ui.theme.SteamAccent
import com.steamaccountmanager.app.ui.theme.SteamSuccess
import com.steamaccountmanager.app.ui.theme.SteamTextSecondary
import org.burnoutcrew.reorderable.ReorderableItem
import org.burnoutcrew.reorderable.detectReorderAfterLongPress
import org.burnoutcrew.reorderable.rememberReorderableLazyListState
import org.burnoutcrew.reorderable.reorderable

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onAccountClick: (Account) -> Unit,
    onAddAccountClick: () -> Unit,
    onSettingsClick: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()

    val reorderState = rememberReorderableLazyListState(
        onMove = { from, to ->
            val current = state.accounts.toMutableList()
            val item = current.removeAt(from.index)
            current.add(to.index, item)
            viewModel.onDragReorder(current)
        },
        onDragEnd = { _, _ ->
            viewModel.commitReorder(state.accounts.map { it.id })
        },
    )

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Steam Account Manager", style = MaterialTheme.typography.titleLarge) },
                actions = {
                    IconButton(onClick = onSettingsClick) {
                        Icon(Icons.Filled.Settings, contentDescription = "Settings")
                    }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (state.accounts.isEmpty() && !state.isLoading) {
                EmptyState(onAddAccountClick)
            } else {
                LazyColumn(
                    state = reorderState.listState,
                    modifier = Modifier
                        .fillMaxSize()
                        .reorderable(reorderState),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(state.accounts, key = { it.id }) { account ->
                        // Use the core overload: the library's LazyItemScope overload calls
                        // animateItemPlacement, which was removed from newer Compose versions.
                        ReorderableItem(
                            state = reorderState,
                            key = account.id,
                            defaultDraggingModifier = Modifier.animateItem(),
                        ) { isDragging ->
                            AccountCard(
                                account = account,
                                isDragging = isDragging,
                                dragModifier = Modifier.detectReorderAfterLongPress(reorderState),
                                onClick = { onAccountClick(account) },
                            )
                        }
                    }
                    item { Box(modifier = Modifier.size(72.dp)) } // room for FAB overlap
                }
            }

            AddAccountButton(onClick = onAddAccountClick, modifier = Modifier.align(Alignment.BottomCenter).padding(24.dp))
        }
    }
}

@Composable
private fun AccountCard(
    account: Account,
    isDragging: Boolean,
    dragModifier: Modifier,
    onClick: () -> Unit,
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isDragging) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isDragging) 8.dp else 0.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AvatarCircle(account = account, size = 52.dp)
            Column(modifier = Modifier.weight(1f).padding(horizontal = 14.dp)) {
                Text(account.displayName, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Spacer(4.dp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(SteamSuccess),
                    )
                    Spacer(6.dp)
                    Text(
                        text = "Session ready",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SteamTextSecondary,
                    )
                }
            }
            Icon(
                Icons.Filled.DragHandle,
                contentDescription = "Reorder",
                tint = SteamTextSecondary,
                modifier = dragModifier,
            )
        }
    }
}

@Composable
private fun AvatarCircle(account: Account, size: androidx.compose.ui.unit.Dp) {
    if (account.avatarUrl != null) {
        AsyncImage(
            model = account.avatarUrl,
            contentDescription = null,
            modifier = Modifier.size(size).clip(CircleShape),
        )
    } else {
        Box(
            modifier = Modifier.size(size).clip(CircleShape).background(SteamAccent.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = account.displayName.take(1).uppercase(),
                style = MaterialTheme.typography.titleLarge,
                color = SteamAccent,
            )
        }
    }
}

@Composable
private fun AddAccountButton(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Filled.Add, contentDescription = null, tint = Color(0xFF0F1115))
            Spacer(8.dp)
            Text("Add Account", color = Color(0xFF0F1115), style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun EmptyState(onAddAccountClick: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("No accounts yet", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
        Spacer(8.dp)
        Text(
            "Add your first Steam account to get started.",
            style = MaterialTheme.typography.bodyLarge,
            color = SteamTextSecondary,
        )
        Spacer(20.dp)
        AddAccountButton(onClick = onAddAccountClick)
    }
}

@Composable
private fun Spacer(sizeDp: Int) = androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(sizeDp.dp))

@Composable
private fun Spacer(size: androidx.compose.ui.unit.Dp) = androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(size))

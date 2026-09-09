@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.steamaccountmanager.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.animation.core.spring
import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.gestures.scrollBy
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.zIndex
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.style.TextOverflow
import coil.compose.AsyncImage
import com.steamaccountmanager.app.domain.model.Account
import com.steamaccountmanager.app.ui.theme.SteamAccent
import com.steamaccountmanager.app.ui.theme.SteamSuccess
import com.steamaccountmanager.app.ui.theme.SteamTextSecondary

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onAccountClick: (Account) -> Unit,
    onAddAccountClick: () -> Unit,
    onSettingsClick: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    var editingAccount by remember { mutableStateOf<Account?>(null) }
    var deletingAccount by remember { mutableStateOf<Account?>(null) }
    var editedName by remember { mutableStateOf("") }

    val listState = rememberLazyListState()
    var draggedId by remember { mutableStateOf<String?>(null) }
    var draggedTop by remember { mutableStateOf(0f) }
    var draggedHeight by remember { mutableStateOf(0) }
    val scrollEdge = with(LocalDensity.current) { 64.dp.toPx() }

    fun moveDraggedAccount() {
        val id = draggedId ?: return
        val center = draggedTop + draggedHeight / 2f
        val target = listState.layoutInfo.visibleItemsInfo.firstOrNull {
            it.key != id && it.key is String && center >= it.offset && center < it.offset + it.size
        } ?: return
        viewModel.moveAccount(id, target.index)
    }

    fun finishDrag() {
        viewModel.commitReorder()
        draggedId = null
    }

    LaunchedEffect(draggedId) {
        while (draggedId != null) {
            withFrameNanos { }
            val layout = listState.layoutInfo
            val scroll = when {
                draggedTop < layout.viewportStartOffset + scrollEdge -> -scrollEdge / 5
                draggedTop + draggedHeight > layout.viewportEndOffset - scrollEdge -> scrollEdge / 5
                else -> 0f
            }
            if (scroll != 0f) listState.scrollBy(scroll)
            moveDraggedAccount()
        }
    }

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
                    state = listState,
                    userScrollEnabled = draggedId == null,
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(listState) {
                            detectDragGesturesAfterLongPress(
                                onDragStart = { offset ->
                                    val item = listState.layoutInfo.visibleItemsInfo.firstOrNull {
                                        offset.y >= it.offset && offset.y < it.offset + it.size
                                    }
                                    if (item?.key is String) {
                                        draggedId = item.key as String
                                        draggedTop = item.offset.toFloat()
                                        draggedHeight = item.size
                                    }
                                },
                                onDrag = { change, amount ->
                                    if (draggedId != null) {
                                        change.consume()
                                        draggedTop += amount.y
                                        moveDraggedAccount()
                                    }
                                },
                                onDragEnd = ::finishDrag,
                                onDragCancel = ::finishDrag,
                            )
                        },
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(state.accounts, key = { it.id }) { account ->
                        val isDragging = draggedId == account.id
                        Box(
                            Modifier.animateItem(placementSpec = if (isDragging) null else spring())
                                .zIndex(if (isDragging) 1f else 0f)
                                .graphicsLayer {
                                    translationY = if (isDragging) {
                                        val offset = listState.layoutInfo.visibleItemsInfo
                                            .firstOrNull { it.key == account.id }?.offset ?: 0
                                        draggedTop - offset
                                    } else 0f
                                },
                        ) {
                            AccountCard(
                                account = account,
                                isDragging = isDragging,
                                onClick = { onAccountClick(account) },
                                onEdit = { editingAccount = account; editedName = account.displayName },
                                onDelete = { deletingAccount = account },
                            )
                        }
                    }
                    item { Box(modifier = Modifier.size(72.dp)) } // room for FAB overlap
                }
            }

            AddAccountButton(onClick = onAddAccountClick, modifier = Modifier.align(Alignment.BottomCenter).padding(24.dp))
        }
    }

    editingAccount?.let { account ->
        AlertDialog(
            onDismissRequest = { editingAccount = null },
            title = { Text("Edit account name") },
            text = {
                OutlinedTextField(
                    value = editedName,
                    onValueChange = { editedName = it },
                    label = { Text("Account name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                TextButton(enabled = editedName.isNotBlank(), onClick = {
                    viewModel.renameAccount(account, editedName)
                    editingAccount = null
                }) { Text("Save") }
            },
            dismissButton = { TextButton(onClick = { editingAccount = null }) { Text("Cancel") } },
        )
    }
    deletingAccount?.let { account ->
        AlertDialog(
            onDismissRequest = { deletingAccount = null },
            title = { Text("Delete account?") },
            text = { Text("Remove “${account.displayName}” from Steam Account Manager?") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteAccount(account)
                    deletingAccount = null
                }) { Text("Delete", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { deletingAccount = null }) { Text("Cancel") } },
        )
    }
    state.error?.let { message ->
        AlertDialog(
            onDismissRequest = viewModel::dismissError,
            title = { Text("Could not save changes") },
            text = { Text(message) },
            confirmButton = { TextButton(onClick = viewModel::dismissError) { Text("OK") } },
        )
    }
}

@Composable
private fun AccountCard(
    account: Account,
    isDragging: Boolean,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
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
                Text(account.displayName, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2, overflow = TextOverflow.Ellipsis)
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
                        text = "Hold to reorder",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SteamTextSecondary,
                    )
                }
            }
            IconButton(onClick = onEdit) {
                Icon(Icons.Filled.Edit, contentDescription = "Edit ${account.displayName}", tint = SteamTextSecondary)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Filled.DeleteOutline, contentDescription = "Delete ${account.displayName}",
                    tint = MaterialTheme.colorScheme.error)
            }
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

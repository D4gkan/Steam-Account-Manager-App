@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.steamaccountmanager.app.ui.account

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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.steamaccountmanager.app.domain.model.Account
import com.steamaccountmanager.app.domain.model.Website
import com.steamaccountmanager.app.ui.theme.SteamAccent
import com.steamaccountmanager.app.ui.theme.SteamTextSecondary

@Composable
fun WebsiteSelectionScreen(
    viewModel: WebsiteSelectionViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(state.account?.displayName ?: "") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            state.account?.let { account -> AccountHeader(account) }
            Text(
                "Choose website",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
            )
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(state.websites, key = { it.id }) { website ->
                    WebsiteRow(website = website, onClick = { viewModel.openWebsite(context, website) })
                }
            }
        }
    }
}

@Composable
private fun AccountHeader(account: Account) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (account.avatarUrl != null) {
            AsyncImage(
                model = account.avatarUrl,
                contentDescription = null,
                modifier = Modifier.size(72.dp).clip(CircleShape),
            )
        } else {
            Box(
                modifier = Modifier.size(72.dp).clip(CircleShape).background(SteamAccent.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(account.displayName.take(1).uppercase(), style = MaterialTheme.typography.headlineMedium, color = SteamAccent)
            }
        }
        androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(8.dp))
        Text(account.displayName, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun WebsiteRow(website: Website, onClick: () -> Unit) {
    val context = LocalContext.current
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                if (website.iconRes != null) {
                    AsyncImage(
                        model = "file:///android_asset/${website.iconRes}",
                        contentDescription = website.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)),
                    )
                } else {
                    Box(
                        modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceVariant),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(website.name.take(1), style = MaterialTheme.typography.titleMedium, color = SteamAccent)
                    }
                }
            }
            Column(modifier = Modifier.weight(1f).padding(horizontal = 14.dp)) {
                Text(website.name, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text("Open ${website.name}", style = MaterialTheme.typography.bodyMedium, color = SteamTextSecondary)
            }
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = SteamTextSecondary)
        }
    }
}

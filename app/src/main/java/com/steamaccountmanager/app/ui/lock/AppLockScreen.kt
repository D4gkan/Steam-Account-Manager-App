package com.steamaccountmanager.app.ui.lock

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.steamaccountmanager.app.ui.theme.SteamAccent
import com.steamaccountmanager.app.ui.theme.SteamError
import com.steamaccountmanager.app.ui.theme.SteamTextSecondary

/**
 * PIN-entry screen shown when app lock is enabled. The host Activity
 * ([AppLockActivity]) is responsible for triggering the biometric prompt; the
 * "Use fingerprint" button here just re-requests that prompt.
 */
@Composable
fun AppLockScreen(
    showBiometricOption: Boolean,
    onPinSubmit: (String) -> Boolean, // returns true if correct
    onBiometricRequested: () -> Unit,
    onUnlocked: () -> Unit,
) {
    var pin by remember { mutableStateOf("") }
    var error by remember { mutableStateOf(false) }

    Surface(color = MaterialTheme.colorScheme.background, modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Icon(Icons.Filled.Lock, contentDescription = null, tint = SteamAccent, modifier = Modifier.size(40.dp))
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(16.dp))
            Text("Enter your PIN", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
            androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(20.dp))

            PinDots(length = pin.length, isError = error)

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(28.dp))

            Keypad(
                onDigit = { digit -> if (pin.length < 8) { pin += digit; error = false } },
                onBackspace = { if (pin.isNotEmpty()) pin = pin.dropLast(1) },
            )

            androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(16.dp))

            TextButton(
                onClick = {
                    if (onPinSubmit(pin)) {
                        onUnlocked()
                    } else {
                        error = true
                        pin = ""
                    }
                },
                enabled = pin.length >= 4,
            ) { Text("Confirm") }

            if (showBiometricOption) {
                androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(8.dp))
                TextButton(onClick = onBiometricRequested) {
                    Icon(Icons.Filled.Fingerprint, contentDescription = null, tint = SteamAccent)
                    androidx.compose.foundation.layout.Spacer(modifier = Modifier.size(6.dp))
                    Text("Use fingerprint instead")
                }
            }
        }
    }
}

@Composable
private fun PinDots(length: Int, isError: Boolean) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        repeat(8) { index ->
            val filled = index < length
            val color: Color = when {
                isError -> SteamError
                filled -> SteamAccent
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .background(color, CircleShape),
            )
        }
    }
}

@Composable
private fun Keypad(onDigit: (String) -> Unit, onBackspace: () -> Unit) {
    val rows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9"),
        listOf("", "0", "backspace"),
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        rows.forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                row.forEach { key ->
                    when (key) {
                        "" -> Box(modifier = Modifier.size(64.dp))
                        "backspace" -> IconButton(onClick = onBackspace, modifier = Modifier.size(64.dp)) {
                            Icon(Icons.Filled.Backspace, contentDescription = "Backspace", tint = SteamTextSecondary)
                        }
                        else -> TextButton(onClick = { onDigit(key) }, modifier = Modifier.size(64.dp)) {
                            Text(key, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }
        }
    }
}

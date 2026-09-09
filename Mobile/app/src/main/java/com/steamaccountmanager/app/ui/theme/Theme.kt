package com.steamaccountmanager.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

/**
 * The app is dark-mode by design (Section 7 calls for a premium, Steam-inspired
 * dark UI). We intentionally always use the dark scheme regardless of system
 * theme, matching the product's visual direction rather than following the
 * platform's light/dark toggle.
 */
private val SteamDarkColorScheme = darkColorScheme(
    background = SteamBg,
    surface = SteamSurface,
    surfaceVariant = SteamSurfaceAlt,
    primary = SteamAccent,
    onPrimary = SteamBg,
    secondary = SteamAccentDim,
    onBackground = SteamTextPrimary,
    onSurface = SteamTextPrimary,
    onSurfaceVariant = SteamTextSecondary,
    error = SteamError,
)

@Composable
fun SteamAccountManagerTheme(content: @Composable () -> Unit) {
    // isSystemInDarkTheme() intentionally unused for now beyond documenting that
    // this is a deliberate choice, not an oversight.
    isSystemInDarkTheme()
    MaterialTheme(
        colorScheme = SteamDarkColorScheme,
        typography = SteamTypography,
        content = content,
    )
}

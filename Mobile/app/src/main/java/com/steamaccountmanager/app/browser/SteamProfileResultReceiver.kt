package com.steamaccountmanager.app.browser

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.steamaccountmanager.app.SteamAccountManagerApp
import kotlinx.coroutines.launch

/**
 * Runs in the DEFAULT process (not `:browser`). Receives the best-effort avatar /
 * profile-id detection broadcast from [SteamLoginDetector] (sent from inside the
 * browser process) and persists it via the normal repository layer. This is the
 * one piece of cross-process communication the app needs, and it carries only a
 * public avatar image URL and a public Steam profile id/vanity name -- never
 * credentials, cookies, or tokens.
 */
class SteamProfileResultReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != SteamLoginDetector.ACTION_STEAM_PROFILE_DETECTED) return
        val accountId = intent.getStringExtra(SteamLoginDetector.EXTRA_ACCOUNT_ID) ?: return
        val avatarUrl = intent.getStringExtra(SteamLoginDetector.EXTRA_AVATAR_URL)
        val steamProfileId = intent.getStringExtra(SteamLoginDetector.EXTRA_STEAM_PROFILE_ID)

        val app = context.applicationContext as SteamAccountManagerApp
        val pendingResult = goAsync()
        app.applicationScope.launch {
            try {
                app.accountRepository.updateSteamProfile(accountId, avatarUrl, steamProfileId)
            } finally {
                pendingResult.finish()
            }
        }
    }
}

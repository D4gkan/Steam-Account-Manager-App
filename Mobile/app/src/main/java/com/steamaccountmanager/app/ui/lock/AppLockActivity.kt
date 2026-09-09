package com.steamaccountmanager.app.ui.lock

import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.fragment.app.FragmentActivity
import com.steamaccountmanager.app.MainActivity
import com.steamaccountmanager.app.SteamAccountManagerApp
import com.steamaccountmanager.app.security.BiometricAuthHelper
import com.steamaccountmanager.app.ui.theme.SteamAccountManagerTheme

/**
 * Shown in front of [MainActivity] whenever app lock is enabled (Section 17).
 * Uses [FragmentActivity] because AndroidX BiometricPrompt requires it.
 *
 * This activity has no knowledge of accounts or session data -- it purely gates
 * entry. It never touches the browser process or WebView APIs.
 */
class AppLockActivity : FragmentActivity() {

    private lateinit var biometricHelper: BiometricAuthHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        biometricHelper = BiometricAuthHelper(this)
        val app = application as SteamAccountManagerApp
        val pinManager = app.pinManager
        val preferBiometric = app.secureCredentialStore.isBiometricPreferred()
        val canUseBiometric = preferBiometric && biometricHelper.canUseBiometrics()

        setContent {
            SteamAccountManagerTheme {
                AppLockScreen(
                    showBiometricOption = canUseBiometric,
                    onPinSubmit = { pin -> pinManager.verifyPin(pin) },
                    onBiometricRequested = { triggerBiometric() },
                    onUnlocked = { proceedToMain() },
                )
            }
        }

        if (canUseBiometric) {
            triggerBiometric()
        }
    }

    private fun triggerBiometric() {
        biometricHelper.authenticate(
            title = "Unlock Steam Account Manager",
            subtitle = "Confirm it's you",
            onSuccess = { proceedToMain() },
            onError = { /* user cancelled or biometric unavailable -- fall back to PIN UI already shown */ },
            onFailed = { /* one failed attempt -- let the user retry via biometric or switch to PIN */ },
        )
    }

    private fun proceedToMain() {
        (application as SteamAccountManagerApp).unlockedForProcess = true
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}

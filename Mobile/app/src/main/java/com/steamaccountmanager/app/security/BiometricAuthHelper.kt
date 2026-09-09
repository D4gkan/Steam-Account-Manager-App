package com.steamaccountmanager.app.security

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity

/**
 * Thin wrapper over AndroidX Biometric. Falls back gracefully: if the device has no
 * usable biometric enrollment, [canUseBiometrics] returns false and the caller
 * (AppLockScreen) should fall back to the PIN flow instead.
 */
class BiometricAuthHelper(private val activity: FragmentActivity) {

    fun canUseBiometrics(): Boolean {
        val manager = BiometricManager.from(activity)
        val result = manager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK,
        )
        return result == BiometricManager.BIOMETRIC_SUCCESS
    }

    fun authenticate(
        title: String,
        subtitle: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit,
        onFailed: () -> Unit,
    ) {
        val executor = androidx.core.content.ContextCompat.getMainExecutor(activity)
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                onSuccess()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                onError(errString.toString())
            }

            override fun onAuthenticationFailed() {
                onFailed()
            }
        }
        val prompt = BiometricPrompt(activity, executor, callback)
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.BIOMETRIC_WEAK,
            )
            .setNegativeButtonText("Use PIN instead")
            .build()
        prompt.authenticate(info)
    }
}

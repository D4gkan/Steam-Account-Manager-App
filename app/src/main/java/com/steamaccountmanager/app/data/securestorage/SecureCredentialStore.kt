package com.steamaccountmanager.app.data.securestorage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Encrypted-at-rest storage for anything genuinely sensitive: the Steam password a
 * user types in during the Add Account flow (held only transiently, see note below),
 * the app-lock PIN hash, and any other secret metadata.
 *
 * Design notes / security review points:
 *  - Backed by [EncryptedSharedPreferences], which uses a hardware-backed Android
 *    Keystore AES-256-GCM master key (via [MasterKey]) to encrypt both keys and values.
 *  - The file (`secure_credentials.xml`) is explicitly excluded from Android backup
 *    in both backup_rules.xml (legacy) and data_extraction_rules.xml (API 31+).
 *  - This app does NOT need to retain the Steam password after login. The password
 *    the user types into the in-app Steam login page is submitted directly to
 *    Steam's own login form; the app does not need to (and does not) intercept or
 *    store it beyond an optional short-lived "remember for this login attempt" buffer
 *    used only to re-fill the field if Steam Guard requires a second attempt. That
 *    buffer is cleared immediately after the login flow finishes, whether it succeeds
 *    or fails, and is never written to disk unencrypted.
 *  - No credential value is ever logged. Call sites must not pass secrets to
 *    android.util.Log under any build type.
 */
class SecureCredentialStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .setRequestStrongBoxBacked(true) // falls back automatically if StrongBox unavailable
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        FILE_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    /** Stores the SHA-256+salt PIN hash used by AppLock. Never the raw PIN. */
    fun setPinHash(hash: String, salt: String) {
        prefs.edit().putString(KEY_PIN_HASH, hash).putString(KEY_PIN_SALT, salt).apply()
    }

    fun getPinHash(): Pair<String, String>? {
        val hash = prefs.getString(KEY_PIN_HASH, null) ?: return null
        val salt = prefs.getString(KEY_PIN_SALT, null) ?: return null
        return hash to salt
    }

    fun clearPin() {
        prefs.edit().remove(KEY_PIN_HASH).remove(KEY_PIN_SALT).apply()
    }

    fun isAppLockEnabled(): Boolean = prefs.getBoolean(KEY_APP_LOCK_ENABLED, false)

    fun setAppLockEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_APP_LOCK_ENABLED, enabled).apply()
    }

    fun isBiometricPreferred(): Boolean = prefs.getBoolean(KEY_BIOMETRIC_PREFERRED, true)

    fun setBiometricPreferred(preferred: Boolean) {
        prefs.edit().putBoolean(KEY_BIOMETRIC_PREFERRED, preferred).apply()
    }

    /**
     * Transient credential buffer for a single in-progress Steam login attempt
     * (used only to re-populate the password field if a Steam Guard code entry
     * fails and Steam re-shows the login form). Callers MUST call [clearLoginBuffer]
     * as soon as the login flow ends, regardless of outcome.
     */
    fun setLoginBuffer(username: String, password: String) {
        prefs.edit()
            .putString(KEY_LOGIN_BUFFER_USER, username)
            .putString(KEY_LOGIN_BUFFER_PASS, password)
            .apply()
    }

    fun getLoginBuffer(): Pair<String, String>? {
        val user = prefs.getString(KEY_LOGIN_BUFFER_USER, null) ?: return null
        val pass = prefs.getString(KEY_LOGIN_BUFFER_PASS, null) ?: return null
        return user to pass
    }

    fun clearLoginBuffer() {
        prefs.edit().remove(KEY_LOGIN_BUFFER_USER).remove(KEY_LOGIN_BUFFER_PASS).apply()
    }

    companion object {
        private const val FILE_NAME = "secure_credentials.xml"
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_PIN_SALT = "pin_salt"
        private const val KEY_APP_LOCK_ENABLED = "app_lock_enabled"
        private const val KEY_BIOMETRIC_PREFERRED = "biometric_preferred"
        private const val KEY_LOGIN_BUFFER_USER = "login_buffer_user"
        private const val KEY_LOGIN_BUFFER_PASS = "login_buffer_pass"
    }
}

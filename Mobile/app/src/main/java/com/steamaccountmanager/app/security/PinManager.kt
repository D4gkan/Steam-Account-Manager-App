package com.steamaccountmanager.app.security

import android.util.Base64
import com.steamaccountmanager.app.data.securestorage.SecureCredentialStore
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * Handles PIN set/verify using PBKDF2WithHmacSHA256 (an established, non-custom
 * Android/JCE algorithm -- deliberately not "custom cryptography").
 *
 * The PIN itself is never stored; only a salted PBKDF2 hash is persisted, inside
 * the encrypted [SecureCredentialStore].
 */
class PinManager(private val secureStore: SecureCredentialStore) {

    fun setPin(pin: String) {
        val salt = ByteArray(16).also { SecureRandom().nextBytes(it) }
        val hash = hash(pin, salt)
        secureStore.setPinHash(
            hash = Base64.encodeToString(hash, Base64.NO_WRAP),
            salt = Base64.encodeToString(salt, Base64.NO_WRAP),
        )
    }

    fun verifyPin(pin: String): Boolean {
        val stored = secureStore.getPinHash() ?: return false
        val (storedHashB64, storedSaltB64) = stored
        val salt = Base64.decode(storedSaltB64, Base64.NO_WRAP)
        val expected = Base64.decode(storedHashB64, Base64.NO_WRAP)
        val actual = hash(pin, salt)
        return constantTimeEquals(expected, actual)
    }

    fun hasPinSet(): Boolean = secureStore.getPinHash() != null

    fun clearPin() = secureStore.clearPin()

    private fun hash(pin: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(pin.toCharArray(), salt, ITERATIONS, KEY_LENGTH_BITS)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        return factory.generateSecret(spec).encoded
    }

    private fun constantTimeEquals(a: ByteArray, b: ByteArray): Boolean {
        if (a.size != b.size) return false
        var result = 0
        for (i in a.indices) result = result or (a[i].toInt() xor b[i].toInt())
        return result == 0
    }

    companion object {
        private const val ITERATIONS = 120_000
        private const val KEY_LENGTH_BITS = 256
    }
}

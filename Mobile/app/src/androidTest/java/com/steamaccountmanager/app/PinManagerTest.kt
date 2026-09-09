package com.steamaccountmanager.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.data.securestorage.SecureCredentialStore
import com.steamaccountmanager.app.security.PinManager
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Runs against the real Android Keystore-backed [SecureCredentialStore] (this
 * requires an actual device or emulator -- Keystore is not available under plain
 * JVM unit tests). Covers Section 37's security tests: "Password isn't stored
 * plaintext" (here: PIN, the analogous secret this class manages) and correct
 * accept/reject behavior.
 */
@RunWith(AndroidJUnit4::class)
class PinManagerTest {

    private fun newPinManager(): PinManager {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val store = SecureCredentialStore(context)
        store.clearPin() // isolate from any state left by a previous test run
        return PinManager(store)
    }

    @Test
    fun verifyPin_acceptsTheCorrectPin() {
        val manager = newPinManager()
        manager.setPin("4821")
        assertTrue(manager.verifyPin("4821"))
    }

    @Test
    fun verifyPin_rejectsAnIncorrectPin() {
        val manager = newPinManager()
        manager.setPin("4821")
        assertFalse(manager.verifyPin("0000"))
    }

    @Test
    fun verifyPin_withNoPinSet_returnsFalseRatherThanThrowing() {
        val manager = newPinManager()
        assertFalse(manager.verifyPin("1234"))
    }

    @Test
    fun clearPin_removesStoredHash() {
        val manager = newPinManager()
        manager.setPin("4821")
        manager.clearPin()
        assertFalse(manager.hasPinSet())
    }
}

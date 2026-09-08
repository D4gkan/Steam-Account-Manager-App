package com.steamaccountmanager.app.prototype

import com.steamaccountmanager.app.domain.model.SessionIdentifier
import java.nio.file.Path
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class PrototypeSessionTopologyTest {
    @Test
    fun `profile ID is deterministic opaque and collision resistant`() {
        val profile = geckoProfileId(SessionIdentifier("account-a", "steam-community"))

        assertEquals(profile, geckoProfileId(SessionIdentifier("account-a", "steam-community")))
        assertTrue(profile.matches(Regex("gv_[0-9a-f]{64}")))
        assertNotEquals(profile, geckoProfileId(SessionIdentifier("steam-community", "account-a")))
        assertNotEquals(
            geckoProfileId(SessionIdentifier("a", "bc")),
            geckoProfileId(SessionIdentifier("ab", "c")),
        )
    }

    @Test
    fun `profile ID handles unicode empty and formerly sanitized collisions`() {
        assertNotEquals(
            geckoProfileId(SessionIdentifier("å", "網站")),
            geckoProfileId(SessionIdentifier("a", "網站")),
        )
        assertNotEquals(
            geckoProfileId(SessionIdentifier("", "steam")),
            geckoProfileId(SessionIdentifier("steam", "")),
        )
        assertNotEquals(
            geckoProfileId(SessionIdentifier("a/b", "steam")),
            geckoProfileId(SessionIdentifier("ab", "steam")),
        )
        assertNotEquals(
            geckoProfileId(SessionIdentifier("x".repeat(48) + "a", "steam")),
            geckoProfileId(SessionIdentifier("x".repeat(48) + "b", "steam")),
        )
    }

    @Test
    fun `three by four browser-session matrix has unique stable profile IDs`() {
        val pairs = (1..3).flatMap { account ->
            (1..4).map { website -> "account-$account" to "website-$website" }
        }
        val firstPass = pairs.map { (account, website) -> geckoProfileId(SessionIdentifier(account, website)) }
        val secondPass = pairs.map { (account, website) -> geckoProfileId(SessionIdentifier(account, website)) }

        assertEquals(12, firstPass.toSet().size)
        assertEquals(firstPass, secondPass)
        assertTrue(firstPass.all { it.matches(Regex("gv_[0-9a-f]{64}")) })
    }

    @Test
    fun `profile path must remain contained by profile root`() {
        val root = Path.of("prototype-profiles").toAbsolutePath().normalize()
        val contained = root.resolve(geckoProfileId(SessionIdentifier("a", "steam")))

        assertEquals(contained, requireContainedProfilePath(root, contained))
        assertThrows(IllegalArgumentException::class.java) {
            requireContainedProfilePath(root, root.resolve("../escape"))
        }
        assertThrows(IllegalArgumentException::class.java) {
            requireContainedProfilePath(root, root.parent.resolve("outside"))
        }
    }

    @Test
    fun `same profile switch does not restart`() {
        val switches = ProfileSwitchCoordinator("gv_a")

        val request = switches.request("gv_a")

        assertFalse(request.requiresProcessRestart)
        assertEquals("gv_a", request.authorizedProfileId)
    }

    @Test
    fun `cross-profile launch waits for matching process death generation`() {
        val switches = ProfileSwitchCoordinator("gv_a")
        val request = switches.request("gv_b")

        assertTrue(request.requiresProcessRestart)
        assertEquals(null, request.authorizedProfileId)
        assertEquals(null, switches.processDeathObserved(request.generation + 1))
        assertEquals("gv_b", switches.processDeathObserved(request.generation))
        assertEquals(null, switches.processDeathObserved(request.generation))
    }

    @Test
    fun `latest same-active request supersedes a pending cross-profile switch`() {
        val switches = ProfileSwitchCoordinator("gv_a")
        val pendingB = switches.request("gv_b")
        val latestA = switches.request("gv_a")

        assertTrue(latestA.requiresProcessRestart)
        assertEquals(null, switches.processDeathObserved(pendingB.generation))
        assertEquals("gv_a", switches.processDeathObserved(latestA.generation))
    }

    @Test
    fun `explicit stop supersedes a pending profile without authorizing it`() {
        val switches = ProfileSwitchCoordinator("gv_a")
        val pendingB = switches.request("gv_b")
        val stop = switches.stop()

        assertFalse(switches.isPending(pendingB.generation, "gv_b"))
        assertTrue(switches.isPending(stop.generation, null))
        assertFalse(switches.processDeathObserved(pendingB.generation, "gv_b"))
        assertTrue(switches.processDeathObserved(stop.generation, null))
    }

    @Test
    fun `same profile reopen supersedes explicit stop but still waits for death`() {
        val switches = ProfileSwitchCoordinator("gv_b")
        val stop = switches.stop()
        val reopen = switches.request("gv_b")

        assertTrue(reopen.requiresProcessRestart)
        assertFalse(switches.processDeathObserved(stop.generation, null))
        assertTrue(switches.processDeathObserved(reopen.generation, "gv_b"))
    }

    @Test
    fun `destroyed coordinator cannot complete pending profile launch`() {
        val switches = ProfileSwitchCoordinator("gv_a")
        val pendingB = switches.request("gv_b")

        switches.invalidate()

        assertFalse(switches.isPending(pendingB.generation, "gv_b"))
        assertEquals(null, switches.processDeathObserved(pendingB.generation))
    }

    @Test
    fun `switch timeout fails closed and generations remain monotonic`() {
        val switches = ProfileSwitchCoordinator("gv_a")
        val first = switches.request("gv_b")

        assertTrue(switches.timedOut(first.generation))
        assertEquals("GV-PROFILE-SWITCH-TIMEOUT", switches.failureCode)
        assertEquals(null, switches.processDeathObserved(first.generation))

        val second = switches.request("gv_b")
        assertTrue(second.generation > first.generation)
        assertEquals(null, switches.processDeathObserved(first.generation))
        assertEquals("gv_b", switches.processDeathObserved(second.generation))
    }

    @Test
    fun `extension operations require matching profile request and fresh observed state`() {
        val profileA = geckoProfileId(SessionIdentifier("a", "steam"))
        val profileB = geckoProfileId(SessionIdentifier("b", "steam"))
        val extensions = ProfileExtensionState(profileA)

        ExtensionOperation.entries.forEach { operation ->
            if (operation == ExtensionOperation.REINSTALL) return@forEach
            val request = extensions.begin(operation)
            val expected = operation.expectedState
            assertFalse(extensions.confirmFromList(request.id, profileB, expected))
            assertFalse(extensions.confirmFromList(request.id + 1, profileA, expected))
            assertTrue(extensions.confirmFromList(request.id, profileA, expected))
            assertEquals(expected, extensions.observedState)
            assertFalse(extensions.confirmFromList(request.id, profileA, expected))
        }
    }

    @Test
    fun `denied reinstall remains absent and stale completion cannot affect newer request`() {
        val profile = geckoProfileId(SessionIdentifier("a", "steam"))
        val extensions = ProfileExtensionState(profile, ExtensionPresence.ABSENT)
        val denied = extensions.begin(ExtensionOperation.REINSTALL)

        assertTrue(extensions.reinstallDenied(denied.id, profile))
        assertEquals(ExtensionPresence.ABSENT, extensions.observedState)

        val current = extensions.begin(ExtensionOperation.REINSTALL)
        assertFalse(extensions.confirmFromList(denied.id, profile, ExtensionPresence.ENABLED))
        assertTrue(extensions.confirmFromList(current.id, profile, ExtensionPresence.ENABLED))
        assertEquals(ExtensionPresence.ENABLED, extensions.observedState)
    }

    @Test
    fun `extension state is keyed to selected opaque profile only`() {
        val profileA = geckoProfileId(SessionIdentifier("a", "steam"))
        val profileB = geckoProfileId(SessionIdentifier("b", "steam"))
        val extensions = ProfileExtensionState(profileA, ExtensionPresence.DISABLED)
        val request = extensions.begin(ExtensionOperation.ENABLE)

        assertFalse(extensions.confirmFromList(request.id, profileB, ExtensionPresence.ENABLED))
        assertEquals(profileA, extensions.profileId)
        assertEquals(ExtensionPresence.DISABLED, extensions.observedState)
    }

    @Test
    fun `topology diagnostics are fixed and never echo supplied failure data`() {
        val secret = "steamLoginSecure=secret-token"

        assertEquals(
            "GV-PROFILE-SWITCH-TIMEOUT: Old Gecko process did not stop; next profile launch remains blocked.",
            topologyDiagnostic("GV-PROFILE-SWITCH-TIMEOUT", IllegalStateException(secret)),
        )
        assertEquals(
            "GV-EXTENSION-STATE-FAILED: Extension state could not be verified for the selected profile.",
            topologyDiagnostic("GV-EXTENSION-STATE-FAILED", IllegalStateException(secret)),
        )
        assertFalse(topologyDiagnostic("GV-EXTENSION-STATE-FAILED", RuntimeException(secret)).contains(secret))
    }
}

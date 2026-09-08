package com.steamaccountmanager.app.browser

import com.steamaccountmanager.app.domain.model.SessionIdentifier
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class GeckoProfileIdentityTest {

    @Test
    fun `profile id is a deterministic opaque digest of the complete session identity`() {
        val sessionId = SessionIdentifier(accountId = "account-a", websiteId = "steam")

        assertEquals(
            "gv_9c831b5afc802198acd0d4b637e870170cdc0b9830f0cfeb8acf5fdbd03d1f81",
            GeckoProfileIdentity.idFor(sessionId),
        )
        assertEquals(GeckoProfileIdentity.idFor(sessionId), GeckoProfileIdentity.idFor(sessionId.copy()))
    }

    @Test
    fun `profile ids do not collide when ids sanitize or concatenate ambiguously`() {
        val sessions = listOf(
            SessionIdentifier(accountId = "account/one", websiteId = "steam"),
            SessionIdentifier(accountId = "accountone", websiteId = "steam"),
            SessionIdentifier(accountId = "ab", websiteId = "c"),
            SessionIdentifier(accountId = "a", websiteId = "bc"),
        )

        val profileIds = sessions.map(GeckoProfileIdentity::idFor)

        assertEquals(sessions.size, profileIds.toSet().size)
        profileIds.forEach { assertTrue(it.matches(Regex("^gv_[0-9a-f]{64}$"))) }
    }

    @Test
    fun `profile path is one contained child of the explicit root`() {
        val root = File("build/test-gecko-profiles").absoluteFile
        val sessionId = SessionIdentifier(accountId = "../../another-profile", websiteId = "steam/../evil")

        val profilePath = GeckoProfileIdentity.pathFor(root, sessionId).toPath().toAbsolutePath().normalize()
        val normalizedRoot = root.toPath().toAbsolutePath().normalize()

        assertTrue(profilePath.startsWith(normalizedRoot))
        assertEquals(normalizedRoot, profilePath.parent)
        assertNotEquals(normalizedRoot, profilePath)
        assertEquals(GeckoProfileIdentity.idFor(sessionId), profilePath.fileName.toString())
    }
}

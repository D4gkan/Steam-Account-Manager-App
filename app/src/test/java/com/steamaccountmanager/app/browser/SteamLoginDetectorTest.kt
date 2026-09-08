package com.steamaccountmanager.app.browser

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SteamLoginDetectorTest {

    @Test
    fun `parse result accepts validated Steam profile metadata`() {
        val raw = "\"{\\\"avatarUrl\\\":\\\"https://avatars.steamstatic.com/abc123_full.jpg\\\",\\\"profileUrl\\\":\\\"https://steamcommunity.com/profiles/76561198000000000/\\\"}\""

        assertEquals(
            SteamProfileResult(
                avatarUrl = "https://avatars.steamstatic.com/abc123_full.jpg",
                steamProfileId = "76561198000000000",
            ),
            SteamLoginDetector.parseResult(raw),
        )
    }

    @Test
    fun `parse result excludes insecure foreign and deceptive metadata`() {
        val foreignAvatar = "\"{\\\"avatarUrl\\\":\\\"https://avatars.steamstatic.com.evil.example/avatar.jpg\\\",\\\"profileUrl\\\":\\\"https://steamcommunity.com/id/safe-name/\\\"}\""
        val insecureProfile = "\"{\\\"avatarUrl\\\":\\\"http://avatars.steamstatic.com/avatar.jpg\\\",\\\"profileUrl\\\":\\\"http://steamcommunity.com/profiles/76561198000000000/\\\"}\""
        val malformed = "not-json"

        assertEquals("safe-name", SteamLoginDetector.parseResult(foreignAvatar)?.steamProfileId)
        assertNull(SteamLoginDetector.parseResult(foreignAvatar)?.avatarUrl)
        assertNull(SteamLoginDetector.parseResult(insecureProfile))
        assertNull(SteamLoginDetector.parseResult(malformed))
    }

    @Test
    fun `logged in page check validates scheme and host instead of substrings`() {
        assertTrue(SteamLoginDetector.looksLikeLoggedInSteamPage("https://steamcommunity.com/profiles/76561198000000000/"))
        assertFalse(SteamLoginDetector.looksLikeLoggedInSteamPage("https://steamcommunity.com.evil.example/profiles/76561198000000000/"))
        assertFalse(SteamLoginDetector.looksLikeLoggedInSteamPage("https://evil.example/steamcommunity.com/id/victim"))
        assertFalse(SteamLoginDetector.looksLikeLoggedInSteamPage("http://steamcommunity.com/id/victim"))
        assertFalse(SteamLoginDetector.looksLikeLoggedInSteamPage("https://steamcommunity.com/login/home"))
    }

    @Test
    fun `parse result rejects oversized messages and metadata urls`() {
        val oversizedRaw = """{"avatarUrl":"https://avatars.steamstatic.com/avatar.jpg","profileUrl":null,"padding":"${"x".repeat(9_000)}"}"""
        val oversizedAvatar = """{"avatarUrl":"https://avatars.steamstatic.com/${"a".repeat(3_000)}.jpg","profileUrl":null}"""

        assertNull(SteamLoginDetector.parseResult(oversizedRaw))
        assertNull(SteamLoginDetector.parseResult(oversizedAvatar))
        assertFalse(
            SteamLoginDetector.looksLikeLoggedInSteamPage(
                "https://steamcommunity.com/?padding=${"x".repeat(3_000)}",
            ),
        )
    }
}

package com.steamaccountmanager.app.browser

import android.content.Context
import android.content.Intent
import java.net.URI

/**
 * Best-effort detection of a successful Steam login inside the isolated Gecko
 * session, so the app can automatically fetch the account's avatar
 * (Section 6). This deliberately does NOT call any Steam Web API (which would
 * require an API key / backend) -- it just reads the logged-in page's own DOM,
 * the same information already visible to the user on screen.
 *
 * This is inherently a heuristic: Steam can change its page markup at any time,
 * in which case avatar detection will simply fail silently and the account will
 * show its default placeholder avatar. The account itself is never blocked or
 * broken by a detection failure -- this is a nice-to-have, not a requirement for
 * the session to work.
 */
object SteamLoginDetector {

    const val ACTION_STEAM_PROFILE_DETECTED = "com.steamaccountmanager.app.action.STEAM_PROFILE_DETECTED"
    const val EXTRA_ACCOUNT_ID = "extra_account_id"
    const val EXTRA_AVATAR_URL = "extra_avatar_url"
    const val EXTRA_STEAM_PROFILE_ID = "extra_steam_profile_id"

    /** Only worth attempting on steamcommunity.com pages that look like a logged-in view. */
    fun looksLikeLoggedInSteamPage(url: String?): Boolean {
        val uri = safeHttpsUri(url) ?: return false
        if (uri.host.lowercase() !in STEAM_COMMUNITY_HOSTS) return false
        val path = uri.path.orEmpty()
        return path == "/" || PROFILE_PATH.matches(path)
    }

    /** Parses only public metadata from the detector extension's JSON message. */
    fun parseResult(raw: String?): SteamProfileResult? {
        if (raw == null || raw.length > MAX_RAW_RESULT_LENGTH) return null
        val json = unwrapJavascriptResult(raw) ?: return null
        val avatarUrl = field(json, "avatarUrl")?.takeIf(::isSafeSteamAvatar)
        val steamProfileId = field(json, "profileUrl")?.let(::validatedSteamProfileId)
        return if (avatarUrl == null && steamProfileId == null) null else SteamProfileResult(avatarUrl, steamProfileId)
    }

    fun sendResult(result: SteamProfileResult, accountId: String, appContext: Context) {
        result.send(accountId, appContext)
    }

    private fun SteamProfileResult.send(accountId: String, appContext: Context) {
        val intent = Intent(ACTION_STEAM_PROFILE_DETECTED).apply {
            setPackage(appContext.packageName)
            putExtra(EXTRA_ACCOUNT_ID, accountId)
            putExtra(EXTRA_AVATAR_URL, avatarUrl)
            putExtra(EXTRA_STEAM_PROFILE_ID, steamProfileId)
        }
        appContext.sendBroadcast(intent)
    }

    private fun validatedSteamProfileId(value: String): String? {
        val uri = safeHttpsUri(value) ?: return null
        if (uri.host.lowercase() !in STEAM_COMMUNITY_HOSTS || uri.query != null || uri.fragment != null) return null
        val match = PROFILE_PATH.matchEntire(uri.path.orEmpty()) ?: return null
        return match.groupValues[1].ifBlank { match.groupValues[2] }
    }

    private fun isSafeSteamAvatar(value: String): Boolean {
        val uri = safeHttpsUri(value) ?: return false
        val host = uri.host.lowercase()
        return uri.fragment == null &&
            (host == "steamcdn-a.akamaihd.net" || host.endsWith(".steamstatic.com"))
    }

    private fun safeHttpsUri(value: String?): URI? = try {
        if (value == null || value.length > MAX_URL_LENGTH) return null
        URI(value).takeIf {
            it.scheme.equals("https", ignoreCase = true) &&
                it.host != null && it.rawUserInfo == null && it.port in setOf(-1, 443)
        }
    } catch (_: Exception) {
        null
    }

    private fun unwrapJavascriptResult(raw: String?): String? {
        val trimmed = raw?.trim()?.takeIf { it.isNotEmpty() && it != "null" } ?: return null
        return if (trimmed.startsWith('"')) decodeJsonString(trimmed) else trimmed.takeIf { it.startsWith('{') && it.endsWith('}') }
    }

    private fun field(json: String, name: String): String? {
        val match = Regex("\\\"${Regex.escape(name)}\\\"\\s*:\\s*(null|\\\"(?:\\\\.|[^\\\"\\\\])*\\\")")
            .find(json) ?: return null
        return match.groupValues[1].takeUnless { it == "null" }?.let(::decodeJsonString)
    }

    private fun decodeJsonString(literal: String): String? {
        if (literal.length < 2 || literal.first() != '"' || literal.last() != '"') return null
        val decoded = StringBuilder()
        var index = 1
        while (index < literal.lastIndex) {
            val character = literal[index++]
            if (character != '\\') {
                decoded.append(character)
                continue
            }
            if (index >= literal.lastIndex) return null
            when (val escaped = literal[index++]) {
                '"', '\\', '/' -> decoded.append(escaped)
                'b' -> decoded.append('\b')
                'f' -> decoded.append('\u000c')
                'n' -> decoded.append('\n')
                'r' -> decoded.append('\r')
                't' -> decoded.append('\t')
                'u' -> {
                    if (index + 4 > literal.lastIndex) return null
                    decoded.append(literal.substring(index, index + 4).toIntOrNull(16)?.toChar() ?: return null)
                    index += 4
                }
                else -> return null
            }
        }
        return decoded.toString()
    }

    private val STEAM_COMMUNITY_HOSTS = setOf("steamcommunity.com", "www.steamcommunity.com")
    private val PROFILE_PATH = Regex("^/(?:id/([A-Za-z0-9_-]{2,64})|profiles/([0-9]{17}))/?$")
    // Keep hostile input below the recursive-regex range before field extraction.
    private const val MAX_RAW_RESULT_LENGTH = 2_048
    private const val MAX_URL_LENGTH = 2_048
}

data class SteamProfileResult(
    val avatarUrl: String?,
    val steamProfileId: String?,
)

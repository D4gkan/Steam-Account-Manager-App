package com.steamaccountmanager.app.browser

import java.io.File
import java.net.URL
import java.net.URI
import java.security.MessageDigest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Only immutable publisher packages belong here; Chrome CRX files are not Firefox packages. */
open class BrowserExtensionPackage(
    val NAME: String,
    val ID: String,
    val VERSION: String,
    val XPI_URL: String,
    val SIZE_BYTES: Long,
    val SHA256: String,
    private val POPUP_PATH: String,
) {
    val SIGNED_STATE = 2

    fun isExpected(id: String?, version: String?, signedState: Int): Boolean =
        id == ID && version == VERSION && signedState == SIGNED_STATE

    fun artifactMatches(size: Long, sha256: String): Boolean =
        size == SIZE_BYTES && sha256 == SHA256

    fun canOpenOfficialPopup(id: String?, version: String?, signedState: Int, enabled: Boolean): Boolean =
        enabled && isExpected(id, version, signedState)

    fun officialPopupUri(baseUrl: String?): String? = try {
        val base = URI(baseUrl ?: return null)
        if (base.scheme != "moz-extension" || base.host.isNullOrBlank() || base.userInfo != null ||
            base.query != null || base.fragment != null || base.path != "/"
        ) null else base.resolve(POPUP_PATH).toString()
    } catch (_: IllegalArgumentException) {
        null
    }

    fun prompt(
        name: String?,
        id: String?,
        version: String?,
        permissions: List<String>,
        origins: List<String>,
        dataCollection: List<String>,
    ): String = buildList {
        add("Extension: ${name ?: "Unknown"}")
        add("ID: ${id ?: "Unknown"}")
        add("Version: ${version ?: "Unknown"}")
        add("Permissions (${permissions.size}):")
        addAll(permissions.map { "• $it" })
        add("Origins (${origins.size}):")
        addAll(origins.map { "• $it" })
        add("Data collection (${dataCollection.size}):")
        addAll(dataCollection.map { "• $it" })
    }.joinToString("\n")

    suspend fun downloadVerified(directory: File): File = withContext(Dispatchers.IO) {
        val target = File.createTempFile("verified-extension-", ".xpi", directory)
        try {
            val digest = MessageDigest.getInstance("SHA-256")
            var size = 0L
            URL(XPI_URL).openConnection().apply {
                connectTimeout = 15_000
                readTimeout = 30_000
                useCaches = false
            }.getInputStream().use { input ->
                target.outputStream().buffered().use { output ->
                    val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                    while (true) {
                        val count = input.read(buffer)
                        if (count < 0) break
                        size += count
                        if (size > SIZE_BYTES) error("EXTENSION_ARTIFACT_MISMATCH")
                        digest.update(buffer, 0, count)
                        output.write(buffer, 0, count)
                    }
                }
            }
            val hash = digest.digest().joinToString("") { "%02X".format(it) }
            if (!artifactMatches(size, hash)) error("EXTENSION_ARTIFACT_MISMATCH")
            target
        } catch (failure: Exception) {
            target.delete()
            throw failure
        }
    }
}

object CsfloatExtensionContract : BrowserExtensionPackage(
    "CSFloat", "{194d0dc6-7ada-41c6-88b8-95d7636fe43c}", "5.17.0",
    "https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi",
    7_011_169L, "70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D",
    "src/popup.html",
)

object BrowserExtensionPackages {
    val CSMONEY = BrowserExtensionPackage(
        "CS.MONEY", "market@csmoney.com", "5.0.3",
        "https://addons.mozilla.org/firefox/downloads/file/4978360/cs_money-5.0.3.xpi",
        1_273_072L, "B1E41D89D25ECF275F3F44B00E7100E7BA32F1B438525D62DFE7C0DBD1AC420F",
        "index.html",
    )
    val SKINS = BrowserExtensionPackage(
        "Skins.com", "skinscom-p2p-extension@skins.com", "1.0.7",
        "https://addons.mozilla.org/firefox/downloads/file/4898295/skins_com-1.0.7.xpi",
        127_158L, "E1E33979B713FC32517B547C19477F5F8625FC88BBE0DACB0AEDF2E35D6DC513",
        "src/popup/popup.html",
    )

    fun forWebsite(websiteId: String): BrowserExtensionPackage? = when (websiteId) {
        "steam", "csfloat" -> CsfloatExtensionContract
        "csmoney" -> CSMONEY
        "skins_com" -> SKINS
        else -> null
    }
}

enum class CsfloatPopupState { UNAVAILABLE, AVAILABLE, OPENED, FAILED }

enum class CsfloatTrackingState { ACTIVE, INACTIVE, UNKNOWN, FAILED }

fun csfloatTrackingMessage(state: CsfloatTrackingState): String = when (state) {
    CsfloatTrackingState.ACTIVE -> "CSFloat tracking: active"
    CsfloatTrackingState.INACTIVE -> "CSFloat tracking: inactive"
    CsfloatTrackingState.UNKNOWN -> "CSFloat tracking: unknown; inspect the official popup."
    CsfloatTrackingState.FAILED -> "CSFloat tracking: failed; retry inspection."
}

enum class CsfloatDenialState { ABSENT, DISABLED, ENABLED, QUERY_FAILED }

fun csfloatDenialMessage(state: CsfloatDenialState): String = when (state) {
    CsfloatDenialState.ABSENT ->
        "CSFloat: consent denied; extension absent; browsing remains available."
    CsfloatDenialState.DISABLED ->
        "CSFloat: consent denied; extension disabled; browsing remains available."
    CsfloatDenialState.ENABLED ->
        "CSFloat: consent denied but extension remained enabled; it was removed. Retry or browse externally."
    CsfloatDenialState.QUERY_FAILED ->
        "CSFloat: consent denied but extension state could not be verified. Close or retry."
}

class CsfloatPopupStatus {
    var state = CsfloatPopupState.UNAVAILABLE
        private set
    var pendingRequest: Long? = null
        private set
    var officialSurfaceOpened = false
        private set
    private var nextRequest = 1L

    fun unavailable() {
        state = CsfloatPopupState.UNAVAILABLE
        pendingRequest = null
        officialSurfaceOpened = false
    }

    fun available() {
        if (state == CsfloatPopupState.UNAVAILABLE) state = CsfloatPopupState.AVAILABLE
    }

    fun requestOpen(open: () -> Unit): Long? {
        if (state !in setOf(CsfloatPopupState.AVAILABLE, CsfloatPopupState.OPENED) || pendingRequest != null) return null
        return nextRequest++.also { pendingRequest = it; open() }
    }

    fun opened(request: Long?): Boolean {
        if (request == null || request != pendingRequest) return false
        pendingRequest = null
        officialSurfaceOpened = true
        state = CsfloatPopupState.OPENED
        return true
    }

    fun failed(request: Long? = pendingRequest): Boolean {
        if (request == null || request != pendingRequest) return false
        pendingRequest = null
        officialSurfaceOpened = false
        state = CsfloatPopupState.FAILED
        return true
    }

    fun discoveryFailed() {
        pendingRequest = null
        officialSurfaceOpened = false
        state = CsfloatPopupState.FAILED
    }

    fun recover() = unavailable()
}

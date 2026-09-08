package com.steamaccountmanager.app.prototype

const val CSFLOAT_ID = "{194d0dc6-7ada-41c6-88b8-95d7636fe43c}"
const val CSFLOAT_VERSION = "5.17.0"

fun isExpectedCsfloat(id: String?, version: String?): Boolean =
    id == CSFLOAT_ID && version == CSFLOAT_VERSION

fun isCsfloatRevocationTarget(id: String?): Boolean = id == CSFLOAT_ID

fun installPrompt(
    name: String?,
    id: String?,
    version: String?,
    permissions: List<String>,
    origins: List<String>,
    dataCollectionPermissions: List<String>,
): String = buildList {
    add("Extension: ${name ?: "Unknown"}")
    add("ID: ${id ?: "Unknown"}")
    add("Version: ${version ?: "Unknown"}")
    add("Permissions (${permissions.size}):")
    addAll(permissions.map { "• $it" })
    add("Origins (${origins.size}):")
    addAll(origins.map { "• $it" })
    add("Data collection (${dataCollectionPermissions.size}):")
    addAll(dataCollectionPermissions.map { "• $it" })
}.joinToString("\n")

enum class PrototypeDiagnostic(val message: String) {
    INSTALL_FAILED(
        "GV-INSTALL-FAILED: Could not download or install CSFloat. Check the network and retry.",
    ),
    INSTALL_NO_RESULT(
        "GV-INSTALL-NO-RESULT: GeckoView returned no installed extension. Retry.",
    ),
    CONSENT_IDENTITY_MISMATCH(
        "GV-CONSENT-IDENTITY-MISMATCH: Install prompt did not identify expected CSFloat. Access denied; retry later.",
    ),
    PACKAGE_MISMATCH(
        "GV-PACKAGE-MISMATCH: GeckoView returned an unexpected package; it was removed. Retry later.",
    ),
    CLEANUP_FAILED(
        "GV-CLEANUP-FAILED: Unexpected package could not be removed. Close the prototype.",
    ),
    PAGE_LOAD_FAILED(
        "GV-PAGE-LOAD-FAILED: The public Steam listing did not load. Check the network and retry.",
    ),
    DENIAL_QUERY_FAILED(
        "GV-DENIAL-QUERY-FAILED: Consent was denied, but CSFloat state could not be verified. Close or retry.",
    ),
}

enum class DenialState { EXPECTED_ABSENT, EXPECTED_DISABLED, EXPECTED_ENABLED }

fun denialState(expectedExtensionEnabledStates: List<Boolean>): DenialState = when {
    expectedExtensionEnabledStates.isEmpty() -> DenialState.EXPECTED_ABSENT
    expectedExtensionEnabledStates.any { it } -> DenialState.EXPECTED_ENABLED
    else -> DenialState.EXPECTED_DISABLED
}

fun denialMessage(state: DenialState): String = when (state) {
    DenialState.EXPECTED_ABSENT ->
        "GV-INSTALL-DENIED-ABSENT: Consent denied; engine reports expected CSFloat ID absent. Retry is available."
    DenialState.EXPECTED_DISABLED ->
        "GV-INSTALL-DENIED-DISABLED: Consent denied; engine reports expected CSFloat ID disabled. Retry is available."
    DenialState.EXPECTED_ENABLED ->
        "GV-INSTALL-DENIED-ENABLED: Consent denied, but engine reports expected CSFloat ID enabled. Close the prototype."
}

fun isEnabledExpectedExtension(id: String?, version: String?, enabled: Boolean): Boolean =
    enabled && isExpectedCsfloat(id, version)

fun canReuseValidatedAction(
    boundId: String?,
    boundVersion: String?,
    discoveredId: String?,
    discoveredVersion: String?,
    discoveredEnabled: Boolean,
    hasEffectiveAction: Boolean,
): Boolean = hasEffectiveAction &&
    isExpectedCsfloat(boundId, boundVersion) &&
    isEnabledExpectedExtension(discoveredId, discoveredVersion, discoveredEnabled) &&
    boundId == discoveredId && boundVersion == discoveredVersion

enum class TrackingState { UNAVAILABLE, READY, ACTIVE, FAILED }

fun trackingMessage(state: TrackingState): String = when (state) {
    TrackingState.UNAVAILABLE ->
        "GV-ACTION-UNAVAILABLE: Install and enable exact CSFloat first."
    TrackingState.READY ->
        "GV-ACTION-READY: Official CSFloat action is ready. Live authenticated proof pending #7."
    TrackingState.ACTIVE ->
        "GV-ACTION-ACTIVE: Visible official CSFloat status recorded. Live authenticated proof pending #7."
    TrackingState.FAILED ->
        "GV-ACTION-FAILED: Official CSFloat popup failed. Recover and retry."
}

class PrototypeTracking {
    var state = TrackingState.UNAVAILABLE
        private set
    var inFlightRequestId: Long? = null
        private set
    var diagnostic: String? = null
        private set
    var officialSurfaceOpened = false
        private set
    private var nextRequestId = 1L

    fun unavailable() {
        state = TrackingState.UNAVAILABLE
        inFlightRequestId = null
        diagnostic = null
        officialSurfaceOpened = false
    }

    fun actionAvailable() {
        if (state == TrackingState.UNAVAILABLE) state = TrackingState.READY
    }

    fun requestAction(click: () -> Unit): Long? {
        if ((state != TrackingState.READY && state != TrackingState.ACTIVE) || inFlightRequestId != null) {
            return null
        }
        val requestId = nextRequestId++
        inFlightRequestId = requestId
        click()
        return requestId
    }

    fun popupOpened(requestId: Long?): Boolean {
        if (requestId == null || requestId != inFlightRequestId) return false
        inFlightRequestId = null
        officialSurfaceOpened = true
        return true
    }

    fun popupFailed(requestId: Long?): Boolean {
        if (requestId == null || requestId != inFlightRequestId) return false
        inFlightRequestId = null
        state = TrackingState.FAILED
        officialSurfaceOpened = false
        diagnostic = trackingMessage(TrackingState.FAILED)
        return true
    }

    fun actionClickFailed(requestId: Long?): Boolean {
        if (requestId == null || requestId != inFlightRequestId) return false
        inFlightRequestId = null
        state = TrackingState.FAILED
        officialSurfaceOpened = false
        diagnostic = "GV-ACTION-CLICK-FAILED: Official CSFloat action did not open. Recover and retry."
        return true
    }

    fun discoveryFailed() {
        inFlightRequestId = null
        state = TrackingState.FAILED
        officialSurfaceOpened = false
        diagnostic = "GV-ACTION-DISCOVERY-FAILED: Could not inspect installed CSFloat state. Recover and retry."
    }

    fun simulatePopupFailure() {
        if (state != TrackingState.READY && inFlightRequestId == null) return
        inFlightRequestId = null
        state = TrackingState.FAILED
        officialSurfaceOpened = false
        diagnostic =
            "GV-SIMULATED-POPUP-FAILURE: Test-only failure recorded. Recover to rediscover CSFloat."
    }

    fun recover() {
        if (state == TrackingState.FAILED) unavailable()
    }

    fun recordVisibleOfficialStatus() {
        if (state == TrackingState.READY && inFlightRequestId == null && officialSurfaceOpened) {
            state = TrackingState.ACTIVE
        }
    }
}

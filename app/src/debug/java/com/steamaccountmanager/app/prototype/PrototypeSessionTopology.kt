package com.steamaccountmanager.app.prototype

import com.steamaccountmanager.app.domain.model.SessionIdentifier
import java.nio.ByteBuffer
import java.nio.file.Path
import java.security.MessageDigest

fun geckoProfileId(sessionIdentifier: SessionIdentifier): String {
    val digest = MessageDigest.getInstance("SHA-256")
    listOf(sessionIdentifier.accountId, sessionIdentifier.websiteId).forEach { value ->
        val bytes = value.toByteArray(Charsets.UTF_8)
        digest.update(ByteBuffer.allocate(Int.SIZE_BYTES).putInt(bytes.size).array())
        digest.update(bytes)
    }
    return "gv_" + digest.digest().joinToString("") { "%02x".format(it) }
}

fun requireContainedProfilePath(root: Path, candidate: Path): Path {
    val normalizedRoot = root.toAbsolutePath().normalize()
    val normalizedCandidate = candidate.toAbsolutePath().normalize()
    require(normalizedCandidate != normalizedRoot && normalizedCandidate.startsWith(normalizedRoot)) {
        "GV-PROFILE-PATH-INVALID"
    }
    return normalizedCandidate
}

data class ProfileSwitchRequest(
    val generation: Long,
    val requiresProcessRestart: Boolean,
    val authorizedProfileId: String?,
)

class ProfileSwitchCoordinator(initialProfileId: String?) {
    private var activeProfileId = initialProfileId
    private var pendingProfileId: String? = null
    private var pendingGeneration: Long? = null
    private var nextGeneration = 1L

    var failureCode: String? = null
        private set

    fun request(profileId: String): ProfileSwitchRequest {
        if (profileId == activeProfileId && pendingGeneration == null) {
            return ProfileSwitchRequest(nextGeneration - 1, false, profileId)
        }
        val generation = nextGeneration++
        pendingProfileId = profileId
        pendingGeneration = generation
        failureCode = null
        return ProfileSwitchRequest(generation, true, null)
    }

    fun stop(): ProfileSwitchRequest {
        val generation = nextGeneration++
        pendingProfileId = null
        pendingGeneration = generation
        failureCode = null
        return ProfileSwitchRequest(generation, true, null)
    }

    fun processDeathObserved(generation: Long): String? {
        val authorized = pendingProfileId ?: return null
        return authorized.takeIf { processDeathObserved(generation, authorized) }
    }

    fun processDeathObserved(generation: Long, expectedProfileId: String?): Boolean {
        if (generation != pendingGeneration || expectedProfileId != pendingProfileId) return false
        expectedProfileId?.let { activeProfileId = it }
        pendingProfileId = null
        pendingGeneration = null
        failureCode = null
        return true
    }

    fun isPending(generation: Long, profileId: String?): Boolean =
        generation == pendingGeneration && profileId == pendingProfileId

    fun timedOut(generation: Long): Boolean {
        if (generation != pendingGeneration) return false
        pendingProfileId = null
        pendingGeneration = null
        failureCode = "GV-PROFILE-SWITCH-TIMEOUT"
        return true
    }

    fun invalidate() {
        nextGeneration++
        pendingProfileId = null
        pendingGeneration = null
        failureCode = null
    }
}

enum class ExtensionPresence { ABSENT, ENABLED, DISABLED }

enum class ExtensionOperation(val expectedState: ExtensionPresence) {
    INSTALL(ExtensionPresence.ENABLED),
    DISABLE(ExtensionPresence.DISABLED),
    ENABLE(ExtensionPresence.ENABLED),
    UNINSTALL(ExtensionPresence.ABSENT),
    REINSTALL(ExtensionPresence.ENABLED),
}

data class ExtensionOperationRequest(
    val id: Long,
    val profileId: String,
    val operation: ExtensionOperation,
)

class ProfileExtensionState(
    val profileId: String,
    initialState: ExtensionPresence = ExtensionPresence.ABSENT,
) {
    var observedState = initialState
        private set
    private var pending: ExtensionOperationRequest? = null
    private var nextRequestId = 1L

    fun begin(operation: ExtensionOperation): ExtensionOperationRequest =
        ExtensionOperationRequest(nextRequestId++, profileId, operation).also { pending = it }

    fun confirmFromList(
        requestId: Long,
        observedProfileId: String,
        freshObservedState: ExtensionPresence,
    ): Boolean {
        val request = pending ?: return false
        if (
            request.id != requestId ||
            request.profileId != observedProfileId ||
            request.operation.expectedState != freshObservedState
        ) {
            return false
        }
        observedState = freshObservedState
        pending = null
        return true
    }

    fun reinstallDenied(requestId: Long, deniedProfileId: String): Boolean {
        val request = pending ?: return false
        if (
            request.id != requestId ||
            request.profileId != deniedProfileId ||
            request.operation != ExtensionOperation.REINSTALL
        ) {
            return false
        }
        observedState = ExtensionPresence.ABSENT
        pending = null
        return true
    }
}

fun topologyDiagnostic(code: String, @Suppress("UNUSED_PARAMETER") failure: Throwable?): String =
    when (code) {
        "GV-PROFILE-SWITCH-TIMEOUT" ->
            "GV-PROFILE-SWITCH-TIMEOUT: Old Gecko process did not stop; next profile launch remains blocked."
        "GV-EXTENSION-STATE-FAILED" ->
            "GV-EXTENSION-STATE-FAILED: Extension state could not be verified for the selected profile."
        else -> "GV-TOPOLOGY-FAILED: Prototype topology operation failed safely."
    }

package com.steamaccountmanager.app.browser

import com.steamaccountmanager.app.domain.model.SessionIdentifier
import java.io.File
import java.nio.ByteBuffer
import java.security.MessageDigest

/** Stable, opaque Gecko profile identity for exactly one browser session. */
object GeckoProfileIdentity {
    fun idFor(sessionId: SessionIdentifier): String {
        val digest = MessageDigest.getInstance("SHA-256")
        listOf(sessionId.accountId, sessionId.websiteId).forEach { value ->
            val bytes = value.toByteArray(Charsets.UTF_8)
            digest.update(ByteBuffer.allocate(Int.SIZE_BYTES).putInt(bytes.size).array())
            digest.update(bytes)
        }
        return "gv_" + digest.digest().joinToString("") { "%02x".format(it) }
    }

    fun pathFor(root: File, sessionId: SessionIdentifier): File {
        val normalizedRoot = root.toPath().toAbsolutePath().normalize()
        val candidate = normalizedRoot.resolve(idFor(sessionId)).normalize()
        require(candidate.parent == normalizedRoot && candidate.startsWith(normalizedRoot)) {
            "Gecko profile path escaped its app-owned root"
        }
        return candidate.toFile()
    }
}

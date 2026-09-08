package com.steamaccountmanager.app

import android.os.Bundle
import android.os.Process
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.steamaccountmanager.app.browser.BrowserProcessController
import com.steamaccountmanager.app.browser.BrowserExtensionPackages
import com.steamaccountmanager.app.browser.BrowserExtensionNotifications
import com.steamaccountmanager.app.browser.GeckoProfileIdentity
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import com.steamaccountmanager.app.ui.browser.GeckoBrowserScreen
import com.steamaccountmanager.app.ui.theme.SteamAccountManagerTheme
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import java.io.File

/**
 * Hosts one isolated Gecko browser session in the dedicated `:browser` process.
 */
class BrowserActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        val accountId = intent.getStringExtra(BrowserProcessController.EXTRA_ACCOUNT_ID).orEmpty()
        val websiteId = intent.getStringExtra(BrowserProcessController.EXTRA_WEBSITE_ID).orEmpty()
        val startUrl = intent.getStringExtra(BrowserProcessController.EXTRA_START_URL).orEmpty()
        val allowedDomains =
            intent.getStringArrayListExtra(BrowserProcessController.EXTRA_ALLOWED_DOMAINS).orEmpty()
        val sessionId = SessionIdentifier(accountId, websiteId)
        val routingToken = intent.getStringExtra(BrowserProcessController.EXTRA_ROUTING_TOKEN)
        if (shutdownRequested || accountId.isBlank() || websiteId.isBlank() || startUrl.isBlank() ||
            allowedDomains.isEmpty() || !BrowserProcessController.isLaunchAuthorized(this, sessionId, routingToken)
        ) {
            Log.e(TAG, "BrowserActivity rejected an incomplete or stale browser-session request.")
            super.onCreate(savedInstanceState)
            finish()
            // A stale top-activity recreation must not leave an empty replacement worker resident.
            if (sharedRuntime == null) Process.killProcess(Process.myPid())
            return
        }

        val steamFeaturesEnabled = usesSteamBrowserFeatures(websiteId)
        val extensionEnabled = BrowserExtensionPackages.forWebsite(websiteId) != null
        val profileId = GeckoProfileIdentity.idFor(sessionId)
        val profile = GeckoProfileIdentity.pathFor(File(noBackupFilesDir, GECKO_PROFILE_ROOT), sessionId)
        if ((!profile.exists() && !profile.mkdirs()) || !profile.isDirectory) {
            Log.e(TAG, "Could not create the isolated Gecko profile directory.")
            super.onCreate(savedInstanceState)
            finish()
            return
        }
        val existing = sharedRuntime
        if (existing != null && sharedProfileId != profileId) {
            Log.e(TAG, "Gecko profile mismatch; refusing to open a second browser session in this process.")
            super.onCreate(savedInstanceState)
            finish()
            return
        }
        val getOrCreateRuntimeAfterConsent = {
            sharedRuntime ?: GeckoRuntime.create(
                applicationContext,
                GeckoRuntimeSettings.Builder().arguments(arrayOf("--profile", profile.absolutePath)).build(),
            ).also {
                sharedRuntime = it
                sharedProfileId = profileId
                BrowserExtensionPackages.forWebsite(websiteId)?.let { extension ->
                    it.webNotificationDelegate = BrowserExtensionNotifications(applicationContext, extension.NAME)
                }
            }
        }

        val consentPreferences = getSharedPreferences(DETECTOR_CONSENT_PREFERENCES, MODE_PRIVATE)
        val showDetectorConsent = steamFeaturesEnabled &&
            !consentPreferences.getBoolean(detectorConsentKey(profileId), false)
        val trustedMarker = File(profile, CSFLOAT_TRUSTED_MARKER)
        val pendingRestorationMarker = File(profile, CSFLOAT_PENDING_RESTORATION_MARKER)
        val initialQuarantine = extensionEnabled &&
            (isCsfloatQuarantined(trustedMarker.isFile) || pendingRestorationMarker.isFile)

        super.onCreate(savedInstanceState)
        setContent {
            SteamAccountManagerTheme {
                GeckoBrowserScreen(
                    getOrCreateRuntimeAfterConsent = getOrCreateRuntimeAfterConsent,
                    accountId = accountId,
                    websiteId = websiteId,
                    startUrl = startUrl,
                    allowedDomains = allowedDomains,
                    steamFeaturesEnabled = steamFeaturesEnabled,
                    showDetectorConsent = showDetectorConsent,
                    initialCsfloatQuarantine = initialQuarantine,
                    initialCsfloatRestorationPending = extensionEnabled && pendingRestorationMarker.isFile,
                    claimCsfloatOperation = { claimCsfloatOperation(profileId) },
                    ownsCsfloatOperation = { token -> ownsCsfloatOperation(profileId, token) },
                    releaseCsfloatOperation = { token -> releaseCsfloatOperation(profileId, token) },
                    persistCsfloatQuarantine = { active ->
                        tryPersistCsfloatQuarantine {
                            if (active) {
                                !trustedMarker.exists() || trustedMarker.delete()
                            } else {
                                trustedMarker.isFile || trustedMarker.createNewFile()
                            }
                        }
                    },
                    persistCsfloatRestorationPending = { active ->
                        tryPersistCsfloatQuarantine {
                            if (active) {
                                pendingRestorationMarker.isFile || pendingRestorationMarker.createNewFile()
                            } else {
                                !pendingRestorationMarker.exists() || pendingRestorationMarker.delete()
                            }
                        }
                    },
                    persistDetectorConsent = {
                        val consentKey = detectorConsentKey(profileId)
                        persistDetectorConsentFailClosed(
                            persist = {
                                consentPreferences.edit().putBoolean(consentKey, true).commit()
                            },
                            rollbackInMemory = {
                                consentPreferences.edit().putBoolean(consentKey, false).apply()
                            },
                            onRollbackFailure = {
                                Log.e(TAG, "Consent cache rollback failed; terminating isolated browser process.")
                                Process.killProcess(Process.myPid())
                            },
                        )
                    },
                    onClose = { finish() },
                )
            }
        }
    }

    companion object {
        private const val TAG = "BrowserActivity"
        private const val GECKO_PROFILE_ROOT = "gecko-browser-profiles"
        internal const val DETECTOR_CONSENT_PREFERENCES = "gecko_detector_consent"
        private const val DETECTOR_CONSENT_VERSION = "steam_profile_detector_consent_v2_"
        private const val CSFLOAT_TRUSTED_MARKER = ".csfloat-trusted"
        private const val CSFLOAT_PENDING_RESTORATION_MARKER = ".csfloat-restoration-pending"

        internal fun detectorConsentKey(profileId: String) = DETECTOR_CONSENT_VERSION + profileId

        private var sharedRuntime: GeckoRuntime? = null
        private var sharedProfileId: String? = null
        private var shutdownRequested = false
        private var csfloatOperationProfileId: String? = null
        private var csfloatOperationToken = 0L

        @Synchronized
        private fun claimCsfloatOperation(profileId: String): Long {
            csfloatOperationProfileId = profileId
            return ++csfloatOperationToken
        }

        @Synchronized
        private fun ownsCsfloatOperation(profileId: String, token: Long) =
            csfloatOperationProfileId == profileId && csfloatOperationToken == token

        @Synchronized
        private fun releaseCsfloatOperation(profileId: String, token: Long) {
            if (ownsCsfloatOperation(profileId, token)) ++csfloatOperationToken
        }

        /** Called inside `:browser`; Gecko gets a graceful profile flush before process death. */
        fun shutdownBrowserProcess() {
            if (shutdownRequested) return
            shutdownRequested = true
            val runtime = sharedRuntime
            BrowserExtensionNotifications.current?.close()
            if (runtime == null) {
                Process.killProcess(Process.myPid())
                return
            }
            runtime.delegate = object : GeckoRuntime.Delegate {
                override fun onShutdown() {
                    Process.killProcess(Process.myPid())
                }
            }
            try {
                runtime.shutdown()
            } catch (_: UnsatisfiedLinkError) {
                Log.e(TAG, "Gecko shutdown requested before native runtime initialization; terminating browser worker.")
                Process.killProcess(Process.myPid())
            }
        }
    }
}

internal fun usesSteamBrowserFeatures(websiteId: String) = websiteId == "steam"

internal fun tryPersistCsfloatQuarantine(persist: () -> Boolean): Boolean = try {
    persist()
} catch (_: Exception) {
    false
}

internal fun isCsfloatQuarantined(trustedMarkerExists: Boolean) = !trustedMarkerExists

internal fun persistDetectorConsentFailClosed(
    persist: () -> Boolean,
    rollbackInMemory: () -> Unit,
    onRollbackFailure: () -> Unit,
): Boolean {
    val persisted = try {
        persist()
    } catch (_: RuntimeException) {
        false
    }
    if (!persisted) {
        try {
            rollbackInMemory()
        } catch (_: RuntimeException) {
            try {
                onRollbackFailure()
            } catch (_: RuntimeException) {
                // Authorization remains denied even if process termination reports an error.
            }
        }
    }
    return persisted
}

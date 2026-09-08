package com.steamaccountmanager.app.ui.browser

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.content.pm.ApplicationInfo
import android.view.ViewGroup
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.steamaccountmanager.app.browser.SteamLoginDetector
import com.steamaccountmanager.app.browser.WebsitePolicy
import com.steamaccountmanager.app.browser.CsfloatExtensionContract
import com.steamaccountmanager.app.browser.BrowserExtensionPackages
import com.steamaccountmanager.app.browser.CsfloatDenialState
import com.steamaccountmanager.app.browser.CsfloatPopupState
import com.steamaccountmanager.app.browser.CsfloatPopupStatus
import com.steamaccountmanager.app.browser.CsfloatTrackingState
import com.steamaccountmanager.app.browser.csfloatDenialMessage
import com.steamaccountmanager.app.browser.csfloatTrackingMessage
import java.io.File
import kotlinx.coroutines.launch
import org.json.JSONObject
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController
import org.mozilla.geckoview.WebRequestError

private const val DEBUG_ACTIVITY_RECREATED = "geckoBrowserActivityRecreated"

private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}

/** The production GeckoView surface for every configured website. */
@Composable
fun GeckoBrowserScreen(
    getOrCreateRuntimeAfterConsent: () -> GeckoRuntime,
    accountId: String,
    websiteId: String,
    startUrl: String,
    allowedDomains: List<String>,
    steamFeaturesEnabled: Boolean,
    showDetectorConsent: Boolean,
    initialCsfloatQuarantine: Boolean,
    initialCsfloatRestorationPending: Boolean,
    claimCsfloatOperation: () -> Long,
    ownsCsfloatOperation: (Long) -> Boolean,
    releaseCsfloatOperation: (Long) -> Unit,
    persistCsfloatQuarantine: (Boolean) -> Boolean,
    persistCsfloatRestorationPending: (Boolean) -> Boolean,
    persistDetectorConsent: () -> Boolean,
    onClose: () -> Unit,
) {
    val selectedPackage = remember(websiteId) { BrowserExtensionPackages.forWebsite(websiteId) }
    val extensionsEnabled = selectedPackage != null
    val extensionPackage = selectedPackage ?: CsfloatExtensionContract
    val extensionName = extensionPackage.NAME
    val context = LocalContext.current
    val debugBuild = remember(context) {
        context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0
    }
    val activityRecreatedForTest = remember(context) {
        val activity = context.findActivity()
        val recreated = debugBuild && activity?.intent?.getBooleanExtra(DEBUG_ACTIVITY_RECREATED, false) == true
        activity?.intent?.removeExtra(DEBUG_ACTIVITY_RECREATED)
        recreated
    }
    val scope = rememberCoroutineScope()
    val policy = remember(allowedDomains) {
        WebsitePolicy(allowedDomains.firstOrNull().orEmpty(), allowedDomains.drop(1))
    }
    var sessionRef by remember { mutableStateOf<GeckoSession?>(null) }
    var detectorExtensionRef by remember { mutableStateOf<WebExtension?>(null) }
    var installedCsfloatRef by remember { mutableStateOf<WebExtension?>(null) }
    var csfloatExtensionRef by remember { mutableStateOf<WebExtension?>(null) }
    var csfloatPopupUri by remember { mutableStateOf<String?>(null) }
    var browserAction by remember { mutableStateOf<WebExtension.Action?>(null) }
    var csfloatState by remember { mutableStateOf("${extensionName}: checking installed state…") }
    var csfloatBusy by remember { mutableStateOf(initialCsfloatRestorationPending) }
    var operationToken by remember { mutableStateOf(claimCsfloatOperation()) }
    var installPromptText by remember { mutableStateOf<String?>(null) }
    var installPromptResult by remember { mutableStateOf<GeckoResult<WebExtension.PermissionPromptResponse>?>(null) }
    var optionalPromptText by remember { mutableStateOf<String?>(null) }
    var optionalPromptResult by remember { mutableStateOf<GeckoResult<AllowOrDeny>?>(null) }
    var showWebsiteAccess by remember { mutableStateOf(false) }
    var installDenied by remember { mutableStateOf(false) }
    var updatePinned by remember { mutableStateOf(false) }
    var updateTestState by remember { mutableStateOf<String?>(null) }
    val popupStatus = remember { CsfloatPopupStatus() }
    var popupState by remember { mutableStateOf(popupStatus.state) }
    var popupDialog by remember { mutableStateOf<Dialog?>(null) }
    var popupView by remember { mutableStateOf<GeckoView?>(null) }
    var popupSession by remember { mutableStateOf<GeckoSession?>(null) }
    val extensionTabs = remember { mutableListOf<GeckoSession>() }
    var tempXpi by remember { mutableStateOf<File?>(null) }
    var failNextPopupForTest by remember { mutableStateOf(false) }
    var failNextCleanupForTest by remember { mutableStateOf(false) }
    var failNextDeniedVerificationForTest by remember { mutableStateOf(false) }
    var failNextMutationForTest by remember { mutableStateOf(false) }
    var failNextUpdateForTest by remember { mutableStateOf(false) }
    var trustAcceptedInstall by remember { mutableStateOf(false) }
    var pendingMutationEnable by remember { mutableStateOf<Boolean?>(null) }
    var pendingUpdateRecovery by remember { mutableStateOf(false) }
    var trackingState by remember { mutableStateOf(CsfloatTrackingState.UNKNOWN) }
    var pendingDeniedVerification by remember { mutableStateOf(false) }
    var pendingCleanup by remember { mutableStateOf<List<WebExtension>>(emptyList()) }
    var pendingCleanupSuccess by remember { mutableStateOf("") }
    var runtimeRef: GeckoRuntime? = null
    var currentUrl by remember { mutableStateOf(startUrl) }
    var safeRecoveryUrl by remember { mutableStateOf(startUrl) }
    var cleanupBlanking by remember { mutableStateOf(false) }
    var csfloatQuarantined by remember { mutableStateOf(extensionsEnabled && initialCsfloatQuarantine) }
    var csfloatRestorationPending by remember { mutableStateOf(initialCsfloatRestorationPending) }
    var trustInspectionComplete by remember { mutableStateOf(!extensionsEnabled) }
    var detectorReady by remember { mutableStateOf(!steamFeaturesEnabled) }
    var initialPageLoaded by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf(websiteId) }
    var progress by remember { mutableFloatStateOf(0f) }
    var loading by remember { mutableStateOf(true) }
    var canGoBack by remember { mutableStateOf(false) }
    var canGoForward by remember { mutableStateOf(false) }
    var blockedUri by remember { mutableStateOf<Uri?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var failedUrl by remember { mutableStateOf<String?>(null) }
    var showConsent by remember { mutableStateOf(showDetectorConsent) }
    var consentPersistenceFailed by remember { mutableStateOf(false) }

    fun claimOperation() = claimCsfloatOperation().also { operationToken = it }
    fun ownsOperation(token: Long) = token == operationToken && ownsCsfloatOperation(token)

    fun openExternal(uri: Uri) {
        if (policy.decideNavigation(uri.toString()) == WebsitePolicy.NavigationDecision.REJECT) {
            error = REJECTED_NAVIGATION_MESSAGE
            return
        }
        try {
            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: Exception) {
            error = "No browser is available to open this link."
        }
    }

    fun renderPopupStatus() {
        popupState = popupStatus.state
    }

    fun quarantineRestoreFailed(message: String) {
        csfloatQuarantined = true
        csfloatBusy = false
        popupStatus.discoveryFailed()
        renderPopupStatus()
        csfloatState = message
        trackingState = CsfloatTrackingState.FAILED
    }

    fun maybeLoadInitialPage() {
        if (!initialPageLoaded && detectorReady && trustInspectionComplete && !csfloatQuarantined) {
            initialPageLoaded = true
            sessionRef?.loadUri(safeRecoveryUrl)
        }
    }

    fun persistQuarantine(active: Boolean): Boolean = try {
        persistCsfloatQuarantine(active)
    } catch (_: Exception) {
        false
    }

    fun persistRestorationPending(active: Boolean): Boolean = try {
        persistCsfloatRestorationPending(active)
    } catch (_: Exception) {
        false
    }

    fun quarantine(): Boolean {
        csfloatQuarantined = true
        cleanupBlanking = true
        sessionRef?.loadUri("about:blank")
        return persistQuarantine(true).also { persisted ->
            if (!persisted) {
                popupStatus.discoveryFailed()
                renderPopupStatus()
                csfloatState = "${extensionName}: quarantine storage failed. Access remains closed; retry."
            }
        }
    }

    fun clearQuarantineAndRestore(): Boolean {
        if (!persistQuarantine(false)) return false
        csfloatQuarantined = false
        trustInspectionComplete = true
        val wasLoaded = initialPageLoaded
        maybeLoadInitialPage()
        if (wasLoaded) sessionRef?.loadUri(safeRecoveryUrl)
        return true
    }

    fun beginRestoration(): Boolean {
        if (!persistRestorationPending(true)) return false
        csfloatRestorationPending = true
        return quarantine()
    }

    fun clearRestorationPending(): Boolean {
        if (!csfloatRestorationPending) return true
        if (!persistRestorationPending(false)) return false
        csfloatRestorationPending = false
        return true
    }

    fun finishRestorationAndRestore(): Boolean {
        if (!clearRestorationPending()) return false
        trustAcceptedInstall = false
        if (clearQuarantineAndRestore()) return true
        if (persistRestorationPending(true)) csfloatRestorationPending = true
        quarantine()
        return false
    }

    fun closePopup() {
        popupDialog?.setOnDismissListener(null)
        popupDialog?.dismiss()
        popupDialog = null
        popupView?.releaseSession()
        popupView = null
        popupSession?.let { session ->
            extensionTabs.remove(session)
            runtimeRef?.webExtensionController?.setTabActive(session, false)
            session.close()
        }
        popupSession = null
        sessionRef?.let { runtimeRef?.webExtensionController?.setTabActive(it, true) }
    }

    fun dismissPopup() {
        popupStatus.pendingRequest?.let {
            popupStatus.failed(it)
            csfloatState = "${extensionName}: official popup closed before loading. Retry."
            trackingState = CsfloatTrackingState.FAILED
            renderPopupStatus()
        }
        closePopup()
    }

    fun clearCsfloat() {
        optionalPromptResult?.complete(AllowOrDeny.DENY)
        optionalPromptResult = null
        optionalPromptText = null
        csfloatExtensionRef?.setActionDelegate(null)
        browserAction = null
        csfloatExtensionRef?.setTabDelegate(null)
        closePopup()
        extensionTabs.toList().forEach { it.close() }
        extensionTabs.clear()
        csfloatExtensionRef = null
        csfloatPopupUri = null
        popupStatus.unavailable()
        renderPopupStatus()
    }

    fun preparePopup(request: Long, uri: String): GeckoSession? {
        try {
            closePopup()
            val popup = GeckoSession().apply {
                contentDelegate = object : GeckoSession.ContentDelegate {
                    override fun onCloseRequest(session: GeckoSession) {
                        Handler(Looper.getMainLooper()).post {
                            if (session === popupSession) dismissPopup()
                        }
                    }
                }
                navigationDelegate = object : GeckoSession.NavigationDelegate {
                    override fun onLoadRequest(
                        session: GeckoSession,
                        request: GeckoSession.NavigationDelegate.LoadRequest,
                    ): GeckoResult<AllowOrDeny> {
                        val isOfficial = Uri.parse(request.uri).let { target ->
                            target.scheme == "moz-extension" && target.host == Uri.parse(uri).host
                        }
                        if (!isOfficial && policy.decideNavigation(request.uri) == WebsitePolicy.NavigationDecision.ALLOW_IN_APP) {
                            sessionRef?.loadUri(request.uri)
                            Handler(Looper.getMainLooper()).post { if (session === popupSession) dismissPopup() }
                        } else if (!isOfficial && policy.decideNavigation(request.uri) == WebsitePolicy.NavigationDecision.OFFER_EXTERNAL) {
                            blockedUri = Uri.parse(request.uri)
                            Handler(Looper.getMainLooper()).post { if (session === popupSession) dismissPopup() }
                        }
                        return GeckoResult.fromValue(if (isOfficial) AllowOrDeny.ALLOW else AllowOrDeny.DENY)
                    }
                }
                progressDelegate = object : GeckoSession.ProgressDelegate {
                    override fun onPageStop(session: GeckoSession, success: Boolean) {
                        if (session !== popupSession) return
                        if (success) {
                            csfloatState = "${extensionName}: official popup opened"
                            popupStatus.opened(request)
                        } else {
                            csfloatState = "${extensionName}: official popup failed to load. Retry."
                            trackingState = CsfloatTrackingState.FAILED
                            popupStatus.failed(request)
                        }
                        renderPopupStatus()
                    }
                }
                open(requireNotNull(runtimeRef))
            }
            val view = GeckoView(context).apply { setSession(popup) }
            val dialog = Dialog(context).apply {
                setTitle("Official ${extensionName} popup")
                setContentView(view, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
                setOnDismissListener { dismissPopup() }
                show()
                window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
            }
            popupSession = popup
            popupView = view
            popupDialog = dialog
            return popup
    } catch (_: RuntimeException) {
        popupStatus.failed(request)
        csfloatState = "${extensionName}: official popup failed to open. Retry."
        trackingState = CsfloatTrackingState.FAILED
        renderPopupStatus()
        closePopup()
        return null
    }
    }

    fun bindCsfloat(extension: WebExtension) {
        clearCsfloat()
        if (!extensionPackage.canOpenOfficialPopup(
                extension.id,
                extension.metaData.version,
                extension.metaData.signedState,
                extension.metaData.enabled,
            )
        ) return
        val popupUri = extensionPackage.officialPopupUri(extension.metaData.baseUrl) ?: run {
            csfloatState = "${extensionName}: official popup metadata is invalid. Retry."
            return
        }
        csfloatExtensionRef = extension
        installedCsfloatRef = extension
        csfloatPopupUri = popupUri
        extension.setActionDelegate(object : WebExtension.ActionDelegate {
            override fun onBrowserAction(source: WebExtension, session: GeckoSession?, action: WebExtension.Action) {
                if (csfloatExtensionRef === extension && session == null) browserAction = action
            }

            override fun onTogglePopup(source: WebExtension, action: WebExtension.Action): GeckoResult<GeckoSession>? {
                val request = popupStatus.pendingRequest ?: return null
                if (csfloatQuarantined || csfloatExtensionRef !== extension ||
                    !extensionPackage.isExpected(source.id, source.metaData.version, source.metaData.signedState)) return null
                return preparePopup(request, popupUri)?.let { GeckoResult.fromValue(it) }
            }
        })
        extension.setTabDelegate(object : WebExtension.TabDelegate {
            override fun onNewTab(
                source: WebExtension,
                details: WebExtension.CreateTabDetails,
            ): GeckoResult<GeckoSession>? {
                val url = details.url ?: return null
                if (csfloatQuarantined || csfloatExtensionRef !== extension ||
                    !extensionPackage.isExpected(source.id, source.metaData.version, source.metaData.signedState)
                ) return null
                if (policy.decideNavigation(url) != WebsitePolicy.NavigationDecision.ALLOW_IN_APP) {
                    if (policy.decideNavigation(url) == WebsitePolicy.NavigationDecision.OFFER_EXTERNAL) {
                        blockedUri = Uri.parse(url)
                        val requestingPopup = popupSession
                        Handler(Looper.getMainLooper()).post { if (requestingPopup === popupSession) dismissPopup() }
                    }
                    return null
                }
                // ponytail: at most two helper tabs; add a tab UI only if a supported package needs more.
                if (extensionTabs.size >= 2) return null
                val tab = GeckoSession()
                extensionTabs.add(tab)
                tab.contentDelegate = object : GeckoSession.ContentDelegate {
                    override fun onCloseRequest(session: GeckoSession) {
                        Handler(Looper.getMainLooper()).post {
                            if (extensionTabs.remove(session)) {
                                if (session === popupSession) dismissPopup() else session.close()
                            }
                        }
                    }
                }
                tab.navigationDelegate = object : GeckoSession.NavigationDelegate {
                    override fun onLoadRequest(
                        session: GeckoSession,
                        request: GeckoSession.NavigationDelegate.LoadRequest,
                    ): GeckoResult<AllowOrDeny> {
                        if (!extensionTabs.contains(session)) return GeckoResult.fromValue(AllowOrDeny.DENY)
                        val decision = policy.decideNavigation(request.uri)
                        if (decision == WebsitePolicy.NavigationDecision.OFFER_EXTERNAL) {
                            blockedUri = Uri.parse(request.uri)
                            Handler(Looper.getMainLooper()).post { if (session === popupSession) dismissPopup() }
                        } else if (decision == WebsitePolicy.NavigationDecision.REJECT) {
                            error = REJECTED_NAVIGATION_MESSAGE
                            Handler(Looper.getMainLooper()).post { if (session === popupSession) dismissPopup() }
                        }
                        return GeckoResult.fromValue(
                            if (!csfloatQuarantined && decision == WebsitePolicy.NavigationDecision.ALLOW_IN_APP)
                                AllowOrDeny.ALLOW else AllowOrDeny.DENY,
                        )
                    }

                    override fun onLoadError(
                        session: GeckoSession, uri: String?, webRequestError: WebRequestError,
                    ): GeckoResult<String>? {
                        if (!extensionTabs.contains(session)) return null
                        error = "This website could not be reached."
                        failedUrl = uri?.takeIf { policy.decideNavigation(it) == WebsitePolicy.NavigationDecision.ALLOW_IN_APP }
                        Handler(Looper.getMainLooper()).post { if (session === popupSession) dismissPopup() }
                        return null
                    }
                }
                tab.webExtensionController.setTabDelegate(source, object : WebExtension.SessionTabDelegate {
                    override fun onCloseTab(source: WebExtension?, session: GeckoSession): GeckoResult<AllowOrDeny> {
                        if (!extensionTabs.remove(session)) return GeckoResult.fromValue(AllowOrDeny.DENY)
                        if (session === popupSession) dismissPopup() else session.close()
                        return GeckoResult.fromValue(AllowOrDeny.ALLOW)
                    }

                    override fun onUpdateTab(
                        source: WebExtension,
                        session: GeckoSession,
                        details: WebExtension.UpdateTabDetails,
                    ): GeckoResult<AllowOrDeny> {
                        val decision = details.url?.let { policy.decideNavigation(it) }
                        if (decision == WebsitePolicy.NavigationDecision.OFFER_EXTERNAL) {
                            blockedUri = Uri.parse(details.url)
                            Handler(Looper.getMainLooper()).post { if (session === popupSession) dismissPopup() }
                        }
                        return GeckoResult.fromValue(
                            if (!csfloatQuarantined && extensionTabs.contains(session) &&
                                (decision == null || decision == WebsitePolicy.NavigationDecision.ALLOW_IN_APP)
                            ) AllowOrDeny.ALLOW else AllowOrDeny.DENY,
                        )
                    }
                })
                // GeckoView opens the returned session with the extension's tab identity.
                if (details.active != false) {
                    var presented = false
                    tab.progressDelegate = object : GeckoSession.ProgressDelegate {
                        override fun onPageStart(session: GeckoSession, url: String) {
                            // Gecko has now opened the returned tab; the requesting popup may be detached.
                            if (presented || csfloatQuarantined || !extensionTabs.contains(tab)) return
                            presented = true
                            closePopup()
                            popupSession = tab
                            popupView = GeckoView(context).apply { setSession(tab) }
                            popupDialog = Dialog(context).apply {
                                setContentView(requireNotNull(popupView))
                                setOnDismissListener { extensionTabs.remove(tab); dismissPopup() }
                                show()
                                window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                            }
                            runtimeRef?.webExtensionController?.setTabActive(tab, true)
                        }
                    }
                } else {
                    Handler(Looper.getMainLooper()).postDelayed({
                        if (extensionTabs.remove(tab)) tab.close()
                    }, 30_000)
                }
                return GeckoResult.fromValue(tab)
            }
        })
        popupStatus.available()
        renderPopupStatus()
        csfloatState = "${extensionName}: enabled (${extension.metaData.version}, signed)"
        trackingState = CsfloatTrackingState.UNKNOWN
    }

    fun cleanupCsfloat(targets: List<WebExtension>, successMessage: String) {
        val owner = claimOperation()
        clearCsfloat()
        pendingCleanup = targets
        pendingCleanupSuccess = successMessage
        if (!quarantine()) return
        val controller = requireNotNull(runtimeRef).webExtensionController
        val rejectedIds = targets.map { it.id }.toSet()

        fun cleanupFailed() {
            if (!ownsOperation(owner)) return
            clearCsfloat()
            popupStatus.discoveryFailed()
            renderPopupStatus()
            csfloatState =
                "${extensionName}: cleanup incomplete; access was closed. Retry cleanup before browsing."
            trackingState = CsfloatTrackingState.FAILED
        }

        fun inspect() {
            controller.list().accept(
                { installed ->
                    if (!ownsOperation(owner)) return@accept
                    if (installed == null || installed.any { it.id in rejectedIds }) {
                        cleanupFailed()
                    } else {
                        installedCsfloatRef = null
                        if (!clearRestorationPending()) {
                            cleanupFailed()
                            return@accept
                        }
                        pendingCleanup = emptyList()
                        pendingCleanupSuccess = ""
                        if (clearQuarantineAndRestore()) {
                            csfloatState = successMessage
                            trackingState = CsfloatTrackingState.INACTIVE
                        } else {
                            cleanupFailed()
                        }
                    }
                },
                { cleanupFailed() },
            )
        }

        fun uninstallAt(index: Int) {
            if (index == targets.size) {
                inspect()
            } else {
                controller.uninstall(targets[index]).accept(
                    { if (ownsOperation(owner)) uninstallAt(index + 1) },
                    { cleanupFailed() },
                )
            }
        }

        if (debugBuild && failNextCleanupForTest) {
            failNextCleanupForTest = false
            cleanupFailed()
        } else {
            uninstallAt(0)
        }
    }

    fun discoverCsfloat(
        absentMessage: String? = null,
        pendingInspections: Int = 50,
        inspectionGeneration: Long = operationToken,
    ) {
        requireNotNull(runtimeRef).webExtensionController.list().accept(
            success@{ extensions ->
                if (!ownsOperation(inspectionGeneration)) return@success
                if (extensions == null) {
                    clearCsfloat()
                    popupStatus.discoveryFailed()
                    renderPopupStatus()
                    csfloatState = "${extensionName}: failed to inspect installed state. Retry."
                    trackingState = CsfloatTrackingState.FAILED
                    quarantine()
                    return@success
                }
                val byId = extensions.orEmpty().filter { it.id == extensionPackage.ID }
                val exact = byId.singleOrNull {
                    extensionPackage.isExpected(it.id, it.metaData.version, it.metaData.signedState)
                }
                when {
                    byId.isNotEmpty() && exact == null -> {
                        cleanupCsfloat(
                            byId,
                            "${extensionName}: unexpected package removed after verification. Retry installation.",
                        )
                    }
                    exact == null && csfloatRestorationPending -> {
                        clearCsfloat()
                        trustInspectionComplete = true
                        if (pendingInspections > 0) {
                            Handler(Looper.getMainLooper()).postDelayed(
                                { discoverCsfloat(absentMessage, pendingInspections - 1, inspectionGeneration) },
                                500,
                            )
                        } else {
                            csfloatState = "${extensionName}: restoration interrupted; extension absent. Retry installation."
                            csfloatBusy = false
                            trackingState = CsfloatTrackingState.INACTIVE
                        }
                    }
                    exact == null -> {
                        clearCsfloat()
                        installedCsfloatRef = null
                        trustInspectionComplete = true
                        if (csfloatQuarantined) {
                            if (clearQuarantineAndRestore()) {
                                csfloatState = absentMessage ?: "${extensionName}: absent"
                            } else {
                                quarantineRestoreFailed(
                                    "${extensionName}: quarantine clearance failed. Access remains closed; retry inspection.",
                                )
                            }
                        } else {
                            csfloatState = absentMessage ?: "${extensionName}: absent"
                            maybeLoadInitialPage()
                        }
                        csfloatBusy = false
                        trackingState = CsfloatTrackingState.INACTIVE
                    }
                    !exact.metaData.enabled && csfloatRestorationPending -> {
                        clearCsfloat()
                        installedCsfloatRef = exact
                        trustInspectionComplete = true
                        if (pendingInspections > 0) {
                            Handler(Looper.getMainLooper()).postDelayed(
                                { discoverCsfloat(absentMessage, pendingInspections - 1, inspectionGeneration) },
                                500,
                            )
                        } else {
                            csfloatState = "${extensionName}: restoration interrupted; extension disabled. Retry enable."
                            csfloatBusy = false
                            trackingState = CsfloatTrackingState.INACTIVE
                        }
                    }
                    !exact.metaData.enabled -> {
                        clearCsfloat()
                        installedCsfloatRef = exact
                        trustInspectionComplete = true
                        if (csfloatQuarantined) {
                            if (clearQuarantineAndRestore()) {
                                csfloatState = "${extensionName}: disabled (${exact.metaData.version}, signed); browsing restored."
                            } else {
                                quarantineRestoreFailed(
                                    "${extensionName}: extension is disabled but quarantine clearance failed. Access remains closed; retry inspection.",
                                )
                            }
                        } else {
                            csfloatState = "${extensionName}: disabled (${exact.metaData.version}, signed)"
                            maybeLoadInitialPage()
                        }
                        csfloatBusy = false
                        trackingState = CsfloatTrackingState.INACTIVE
                    }
                    csfloatRestorationPending -> {
                        if (finishRestorationAndRestore()) {
                            csfloatBusy = false
                            bindCsfloat(exact)
                        }
                        else quarantineRestoreFailed(
                            "${extensionName}: restoration verified but quarantine clearance failed. Access remains closed; retry.",
                        )
                    }
                    csfloatQuarantined && trustAcceptedInstall -> {
                        trustAcceptedInstall = false
                        if (clearQuarantineAndRestore()) {
                            bindCsfloat(exact)
                        } else {
                            cleanupCsfloat(
                                listOf(exact),
                                "${extensionName}: untrusted installation removed; browsing restored.",
                            )
                        }
                    }
                    csfloatQuarantined -> cleanupCsfloat(
                        listOf(exact),
                        "${extensionName}: quarantine cleared; extension absent; browsing restored.",
                    )
                    else -> {
                        bindCsfloat(exact)
                        trustInspectionComplete = true
                        maybeLoadInitialPage()
                    }
                }
            },
            {
                if (!ownsOperation(inspectionGeneration)) return@accept
                clearCsfloat()
                popupStatus.discoveryFailed()
                renderPopupStatus()
                csfloatState = "${extensionName}: failed to inspect installed state. Retry."
                trackingState = CsfloatTrackingState.FAILED
                if (!trustInspectionComplete || csfloatQuarantined) quarantine()
            },
        )
    }

    fun mutateCsfloat(enable: Boolean) {
        if (csfloatBusy) return
        val target = installedCsfloatRef ?: return
        if (!(if (enable) beginRestoration() else quarantine())) return
        val generation = claimOperation()
        csfloatBusy = true
        clearCsfloat()
        csfloatState = "${extensionName}: ${if (enable) "enabling" else "disabling"} verified package…"
        val controller = requireNotNull(runtimeRef).webExtensionController

        fun failed() {
            if (!ownsOperation(generation)) return
            csfloatBusy = false
            popupStatus.discoveryFailed()
            renderPopupStatus()
            csfloatState = "${extensionName}: ${if (enable) "enable" else "disable"} failed; access remains closed. Retry."
            pendingMutationEnable = enable
            trackingState = CsfloatTrackingState.FAILED
        }

        if (debugBuild && failNextMutationForTest) {
            failNextMutationForTest = false
            failed()
            return
        }
        val operation = if (enable) {
            controller.enable(target, WebExtensionController.EnableSource.APP)
        } else {
            controller.disable(target, WebExtensionController.EnableSource.APP)
        }

        fun inspect(remainingStaleInspections: Int) {
            controller.list().accept(
                success@{ extensions ->
                    if (!ownsOperation(generation)) return@success
                    val exact = extensions?.singleOrNull {
                        extensionPackage.isExpected(it.id, it.metaData.version, it.metaData.signedState)
                    }
                    if (exact != null && exact.metaData.enabled != enable && remainingStaleInspections > 0) {
                        Handler(Looper.getMainLooper()).postDelayed(
                            { if (ownsOperation(generation)) inspect(remainingStaleInspections - 1) },
                            500,
                        )
                        return@success
                    }
                    if (exact == null || exact.metaData.enabled != enable) {
                        failed()
                        return@success
                    }
                    installedCsfloatRef = exact
                    if (!(if (enable) finishRestorationAndRestore() else clearQuarantineAndRestore())) {
                        failed()
                    } else if (enable) {
                        pendingMutationEnable = null
                        csfloatBusy = false
                        bindCsfloat(exact)
                    } else {
                        pendingMutationEnable = null
                        csfloatBusy = false
                        clearCsfloat()
                        installedCsfloatRef = exact
                        csfloatState = "${extensionName}: disabled (${exact.metaData.version}, signed); browsing restored."
                        trackingState = CsfloatTrackingState.INACTIVE
                    }
                },
                { failed() },
            )
        }

        operation.accept(
            {
                if (!ownsOperation(generation)) return@accept
                inspect(50)
            },
            { failed() },
        )
    }

    fun verifyDeniedCsfloat(owner: Long = claimOperation()) {
        pendingDeniedVerification = true
        if (!quarantine()) return

        fun verificationFailed() {
            if (!ownsOperation(owner)) return
            clearCsfloat()
            pendingDeniedVerification = true
            popupStatus.discoveryFailed()
            renderPopupStatus()
            csfloatState =
                "${extensionName}: consent denied but extension state could not be verified. Access was closed; retry inspection."
            trackingState = CsfloatTrackingState.FAILED
        }

        if (debugBuild && failNextDeniedVerificationForTest) {
            failNextDeniedVerificationForTest = false
            verificationFailed()
            return
        }
        requireNotNull(runtimeRef).webExtensionController.list().accept(
            success@{ extensions ->
                if (!ownsOperation(owner)) return@success
                if (extensions == null) {
                    verificationFailed()
                    return@success
                }
                val matching = extensions.orEmpty().filter { it.id == extensionPackage.ID }
                val enabled = matching.filter { it.metaData.enabled }
                when {
                    enabled.isNotEmpty() -> {
                        pendingDeniedVerification = false
                        cleanupCsfloat(enabled, csfloatDenialMessage(CsfloatDenialState.ENABLED).replace("CSFloat", extensionName))
                    }
                    matching.isNotEmpty() -> {
                        clearCsfloat()
                        if (clearRestorationPending() && clearQuarantineAndRestore()) {
                            pendingDeniedVerification = false
                            csfloatState = csfloatDenialMessage(CsfloatDenialState.DISABLED).replace("CSFloat", extensionName)
                            trackingState = CsfloatTrackingState.INACTIVE
                        } else {
                            quarantineRestoreFailed(
                                "${extensionName}: consent denied and extension disabled, but quarantine clearance failed. Access remains closed; retry inspection.",
                            )
                        }
                    }
                    else -> {
                        clearCsfloat()
                        if (clearRestorationPending() && clearQuarantineAndRestore()) {
                            pendingDeniedVerification = false
                            csfloatState = csfloatDenialMessage(CsfloatDenialState.ABSENT).replace("CSFloat", extensionName)
                            trackingState = CsfloatTrackingState.INACTIVE
                        } else {
                            quarantineRestoreFailed(
                                "${extensionName}: consent denied and extension absent, but quarantine clearance failed. Access remains closed; retry inspection.",
                            )
                        }
                    }
                }
            },
            {
                verificationFailed()
            },
        )
    }

    fun changeWebsiteAccess(allow: Boolean) {
        val extension = csfloatExtensionRef ?: return
        val origins = extension.metaData.optionalOrigins
        if (csfloatBusy || origins.isEmpty() || !(if (allow) beginRestoration() else quarantine())) return
        val owner = claimOperation()
        csfloatBusy = true
        clearCsfloat()
        val controller = requireNotNull(runtimeRef).webExtensionController
        val operation = if (allow) controller.addOptionalPermissions(
            extension.id, emptyArray(), origins, emptyArray(),
        ) else controller.removeOptionalPermissions(extension.id, emptyArray(), origins, emptyArray())
        operation.accept({ updated ->
            if (ownsOperation(owner)) {
                if (updated != null && extensionPackage.isExpected(updated.id, updated.metaData.version, updated.metaData.signedState) &&
                    origins.all { (it in updated.metaData.grantedOptionalOrigins) == allow } &&
                    (if (allow) finishRestorationAndRestore() else clearQuarantineAndRestore())
                ) {
                    csfloatBusy = false
                    bindCsfloat(updated)
                    csfloatState = "$extensionName: website access ${if (allow) "allowed" else "revoked"}"
                } else quarantineRestoreFailed("$extensionName: permission change could not be verified. Retry.")
            }
        }, {
            if (ownsOperation(owner)) quarantineRestoreFailed("$extensionName: permission change failed. Retry.")
        })
    }

    fun recoverUpdateFailure() {
        val generation = claimOperation()
        requireNotNull(runtimeRef).webExtensionController.list().accept(
            { extensions ->
                if (!ownsOperation(generation)) return@accept
                val exact = extensions?.singleOrNull {
                    extensionPackage.isExpected(it.id, it.metaData.version, it.metaData.signedState) &&
                        it.metaData.enabled
                }
                if (exact != null && clearQuarantineAndRestore()) {
                    pendingUpdateRecovery = false
                    updateTestState = "${extensionName} update failure recovered; exact ${extensionPackage.VERSION} signed enabled unchanged."
                    bindCsfloat(exact)
                } else {
                    popupStatus.discoveryFailed()
                    renderPopupStatus()
                    trackingState = CsfloatTrackingState.FAILED
                    updateTestState = "${extensionName} update recovery failed; access remains closed. Retry."
                }
            },
            {
                if (ownsOperation(generation)) {
                    popupStatus.discoveryFailed()
                    renderPopupStatus()
                    trackingState = CsfloatTrackingState.FAILED
                    updateTestState = "${extensionName} update recovery failed; access remains closed. Retry."
                }
            },
        )
    }

    fun installCsfloat() {
        if (csfloatBusy) return
        if (!beginRestoration()) return
        val generation = claimOperation()
        csfloatBusy = true
        installDenied = false
        trustAcceptedInstall = false
        csfloatState = "${extensionName}: installing verified package…"
        scope.launch {
            try {
                val file = extensionPackage.downloadVerified(context.cacheDir)
                tempXpi = file
                if (!ownsOperation(generation)) {
                    file.delete()
                    tempXpi = null
                    return@launch
                }
                requireNotNull(runtimeRef).webExtensionController.install(
                    Uri.fromFile(file).toString(),
                    WebExtensionController.INSTALLATION_METHOD_FROM_FILE,
                ).accept(
                    { extension ->
                        file.delete()
                        tempXpi = null
                        if (!ownsOperation(generation)) return@accept
                        if (installDenied) {
                            csfloatBusy = false
                            verifyDeniedCsfloat(generation)
                        } else if (extension != null && extensionPackage.isExpected(
                                extension.id,
                                extension.metaData.version,
                                extension.metaData.signedState,
                            )
                        ) {
                            trustAcceptedInstall = true
                            csfloatState = "${extensionName}: installed; discovering official popup…"
                            discoverCsfloat()
                        } else {
                            if (extension == null) {
                                clearCsfloat()
                                discoverCsfloat(
                                    "${extensionName}: install returned no package. Retry; browsing remains available.",
                                )
                            } else {
                                csfloatBusy = false
                                cleanupCsfloat(
                                    listOf(extension),
                                    "${extensionName}: unexpected package removed after verification. Retry installation.",
                                )
                            }
                        }
                    },
                    {
                        file.delete()
                        tempXpi = null
                        if (!ownsOperation(generation)) return@accept
                        if (installDenied) {
                            csfloatBusy = false
                            verifyDeniedCsfloat(generation)
                        } else {
                            clearCsfloat()
                            discoverCsfloat(
                                "${extensionName}: install failed. Check the network and retry; browsing remains available.",
                            )
                        }
                    },
                )
            } catch (_: Exception) {
                tempXpi?.delete()
                tempXpi = null
                if (!ownsOperation(generation)) return@launch
                discoverCsfloat("${extensionName}: download verification failed. Check the network and retry.")
            }
        }
    }

    val promptDelegate = remember {
        object : WebExtensionController.PromptDelegate {
            override fun onInstallPromptRequest(
                extension: WebExtension,
                permissions: Array<out String>,
                origins: Array<out String>,
                dataCollectionPermissions: Array<out String>,
            ): GeckoResult<WebExtension.PermissionPromptResponse> {
                if (extension.id != extensionPackage.ID || extension.metaData.version != extensionPackage.VERSION) {
                    csfloatState = "${extensionName}: install request identity mismatch. Access denied."
                    return GeckoResult.fromValue(WebExtension.PermissionPromptResponse(false, false, false))
                }
                return GeckoResult<WebExtension.PermissionPromptResponse>().also {
                    installPromptResult = it
                    installPromptText = extensionPackage.prompt(
                        extension.metaData.name,
                        extension.id,
                        extension.metaData.version,
                        permissions.toList(),
                        origins.toList(),
                        dataCollectionPermissions.toList(),
                    )
                }
            }

            override fun onUpdatePrompt(
                extension: WebExtension,
                newPermissions: Array<out String>,
                newOrigins: Array<out String>,
                newDataCollectionPermissions: Array<out String>,
            ): GeckoResult<AllowOrDeny> {
                updatePinned = true
                return GeckoResult.fromValue(AllowOrDeny.DENY)
            }

            override fun onOptionalPrompt(
                extension: WebExtension,
                permissions: Array<out String>,
                origins: Array<out String>,
                dataCollectionPermissions: Array<out String>,
            ): GeckoResult<AllowOrDeny> {
                if (csfloatQuarantined || csfloatBusy || optionalPromptResult != null ||
                    installPromptResult != null || csfloatExtensionRef == null ||
                    !extensionPackage.isExpected(extension.id, extension.metaData.version, extension.metaData.signedState)
                ) return GeckoResult.fromValue(AllowOrDeny.DENY)
                return GeckoResult<AllowOrDeny>().also {
                    optionalPromptResult = it
                    optionalPromptText = extensionPackage.prompt(
                        extension.metaData.name, extension.id, extension.metaData.version,
                        permissions.toList(), origins.toList(), dataCollectionPermissions.toList(),
                    )
                }
            }
        }
    }

    if (showConsent) {
        AlertDialog(
            onDismissRequest = onClose,
            title = { Text("Allow Steam profile detection?") },
            text = {
                Text(
                    "Steam opens in an isolated browser, and your sign-in from an earlier app version cannot be migrated, " +
                        "so you may need to sign in again. This app includes a profile detector limited to " +
                        "https://steamcommunity.com and https://www.steamcommunity.com. It reads only visible " +
                        "public avatar and profile links and sends those values only back to this app through " +
                        "its internal connection." +
                        if (consentPersistenceFailed) {
                            " Consent could not be saved. Try again or cancel."
                        } else {
                            ""
                        },
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    if (tryPersistDetectorConsent(persistDetectorConsent)) {
                        consentPersistenceFailed = false
                        showConsent = false
                    } else {
                        consentPersistenceFailed = true
                    }
                }) { Text("Allow and continue") }
            },
            dismissButton = { TextButton(onClick = onClose) { Text("Cancel") } },
        )
        return
    }

    val runtime = remember { getOrCreateRuntimeAfterConsent() }
    runtimeRef = runtime

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Surface(color = MaterialTheme.colorScheme.surface) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    IconButton(onClick = onClose) { Icon(Icons.Filled.Close, "Close") }
                    Text(title, modifier = Modifier.weight(1f).padding(horizontal = 4.dp), maxLines = 1)
                    IconButton(onClick = { sessionRef?.goBack() }, enabled = canGoBack && !csfloatQuarantined) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                    }
                    IconButton(onClick = { sessionRef?.goForward() }, enabled = canGoForward && !csfloatQuarantined) {
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, "Forward")
                    }
                    IconButton(onClick = { sessionRef?.reload() }, enabled = !csfloatQuarantined) {
                        Icon(Icons.Filled.Refresh, "Refresh")
                    }
                    IconButton(onClick = { openExternal(Uri.parse(safeRecoveryUrl)) }) {
                        Icon(Icons.Filled.OpenInBrowser, "Open externally")
                    }
                }
                if (debugBuild) Text(
                    "Gecko page: " + if (initialPageLoaded && !loading && error == null) "ready" else "pending",
                    Modifier.padding(horizontal = 8.dp),
                )
                if (extensionsEnabled) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(csfloatState, modifier = Modifier.weight(1f), maxLines = 2)
                    TextButton(
                        onClick = { installCsfloat() },
                        enabled = trustInspectionComplete && (!csfloatQuarantined || csfloatRestorationPending) &&
                            !csfloatBusy && csfloatExtensionRef == null &&
                            !pendingDeniedVerification && pendingCleanup.isEmpty(),
                    ) {
                        Text(if (csfloatBusy) "Installing" else "Install ${extensionName}")
                    }
                    TextButton(
                        onClick = {
                            val action = browserAction ?: return@TextButton
                            csfloatState = "${extensionName}: opening official popup…"
                            popupStatus.requestOpen {
                                val request = requireNotNull(popupStatus.pendingRequest)
                                if (debugBuild && failNextPopupForTest) {
                                    failNextPopupForTest = false
                                    popupStatus.failed(request)
                                    csfloatState = "${extensionName}: official popup failed to open. Retry."
                                    trackingState = CsfloatTrackingState.FAILED
                                } else {
                                    action.click()
                                }
                            }
                            renderPopupStatus()
                        },
                        enabled = csfloatPopupUri != null && browserAction != null && popupStatus.pendingRequest == null,
                    ) { Text("Open ${extensionName}") }
                }
                Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                    val installed = installedCsfloatRef
                    if (installed != null) {
                        TextButton(
                            onClick = { mutateCsfloat(enable = !installed.metaData.enabled) },
                            enabled = !csfloatBusy &&
                                (!csfloatQuarantined || (csfloatRestorationPending && !installed.metaData.enabled)) &&
                                pendingCleanup.isEmpty() && !pendingDeniedVerification,
                        ) {
                            Text(if (installed.metaData.enabled) "Disable ${extensionName}" else "Enable ${extensionName}")
                        }
                        TextButton(
                            onClick = { cleanupCsfloat(listOf(installed), "${extensionName}: absent; browsing restored.") },
                            enabled = !csfloatBusy && !csfloatQuarantined &&
                                pendingCleanup.isEmpty() && !pendingDeniedVerification,
                        ) { Text("Uninstall ${extensionName}") }
                        if (installed.metaData.enabled && installed.metaData.optionalOrigins.isNotEmpty()) {
                            TextButton(onClick = { showWebsiteAccess = true }, enabled = !csfloatBusy && !csfloatQuarantined) {
                                Text("Website access")
                            }
                        }
                    }
                }
                Text(
                    when (popupState) {
                        CsfloatPopupState.UNAVAILABLE -> "${extensionName} popup: unavailable"
                        CsfloatPopupState.AVAILABLE ->
                            "${extensionName} popup: available. Inspect tracking status inside the official popup."
                        CsfloatPopupState.OPENED ->
                            "${extensionName} popup: opened. Tracking status is shown only inside the official popup."
                        CsfloatPopupState.FAILED -> "${extensionName} popup: failed. Retry is available."
                    },
                    modifier = Modifier.padding(horizontal = 8.dp),
                )
                Text(csfloatTrackingMessage(trackingState).replace("CSFloat", extensionName), Modifier.padding(horizontal = 8.dp))
                Column {
                    if (debugBuild && extensionPackage === BrowserExtensionPackages.SKINS && csfloatExtensionRef != null) {
                        TextButton(onClick = {
                            runtime.webExtensionController.removeOptionalPermissions(
                                extensionPackage.ID, emptyArray(),
                                arrayOf("*://steampowered.com/*", "*://*.steampowered.com/*", "https://api.steampowered.com/*"),
                                emptyArray(),
                            ).accept({ updated ->
                                if (updated != null) {
                                    bindCsfloat(updated)
                                    csfloatState = "$extensionName: Steam API access removed"
                                }
                            }, { csfloatState = "$extensionName: permission removal failed" })
                        }) { Text("Test revoke Steam API access") }
                    }
                    if (debugBuild && popupState == CsfloatPopupState.UNAVAILABLE && !pendingDeniedVerification) {
                        TextButton(onClick = { failNextDeniedVerificationForTest = true }) {
                            Text("Test denied verification failure")
                        }
                    }
                    if (debugBuild && popupState == CsfloatPopupState.AVAILABLE) {
                        TextButton(onClick = {
                            val extension = installedCsfloatRef ?: return@TextButton
                            val controller = requireNotNull(runtimeRef).webExtensionController
                            val generation = claimOperation()
                            updateTestState = "${extensionName} update test: verifying denial and installed package…"
                            fun verifyControllerAttempt() {
                                controller.list().accept(
                                    { extensions ->
                                        if (ownsOperation(generation)) {
                                            val exact = extensions?.singleOrNull {
                                                extensionPackage.isExpected(
                                                    it.id,
                                                    it.metaData.version,
                                                    it.metaData.signedState,
                                                ) && it.metaData.enabled
                                            }
                                            if (exact == null) {
                                                quarantine()
                                                updateTestState =
                                                    "${extensionName} update test failed: exact installed state changed; access closed."
                                            } else {
                                                updateTestState =
                                                    "${extensionName} update test: DENY confirmed; controller reported no update; exact ${extensionPackage.VERSION} signed enabled unchanged."
                                            }
                                        }
                                    },
                                    {
                                        if (ownsOperation(generation)) {
                                            quarantine()
                                            updateTestState =
                                                "${extensionName} update test failed: installed state unavailable; access closed."
                                        }
                                    },
                                )
                            }
                            promptDelegate.onUpdatePrompt(extension, emptyArray(), emptyArray(), emptyArray()).accept(
                                { decision ->
                                    if (!ownsOperation(generation)) Unit
                                    else if (decision != AllowOrDeny.DENY) {
                                        quarantine()
                                        updateTestState = "${extensionName} update test failed: update was not denied; access closed."
                                    } else {
                                        if (failNextUpdateForTest) {
                                            failNextUpdateForTest = false
                                            quarantine()
                                            pendingUpdateRecovery = true
                                            popupStatus.discoveryFailed()
                                            renderPopupStatus()
                                            trackingState = CsfloatTrackingState.FAILED
                                            updateTestState =
                                                "${extensionName} update test failed: controller update failed; access remains closed. Retry."
                                            return@accept
                                        }
                                        controller.update(extension).accept(
                                            { updated ->
                                                if (!ownsOperation(generation)) Unit
                                                else if (updated == null) verifyControllerAttempt()
                                                else if (extensionPackage.isExpected(
                                                        updated.id,
                                                        updated.metaData.version,
                                                        updated.metaData.signedState,
                                                    ) && updated.metaData.enabled
                                                ) verifyControllerAttempt()
                                                else {
                                                    quarantine()
                                                    updateTestState =
                                                        "${extensionName} update test failed: controller returned changed metadata; access closed."
                                                }
                                            },
                                            {
                                                if (ownsOperation(generation)) {
                                                    quarantine()
                                                    pendingUpdateRecovery = true
                                                    popupStatus.discoveryFailed()
                                                    renderPopupStatus()
                                                    trackingState = CsfloatTrackingState.FAILED
                                                    updateTestState =
                                                        "${extensionName} update test failed: controller update failed; access remains closed. Retry."
                                                }
                                            },
                                        )
                                    }
                                },
                                {
                                    if (ownsOperation(generation)) {
                                        quarantine()
                                        updateTestState = "${extensionName} update test failed: denial result unavailable; access closed."
                                    }
                                },
                            )
                        }) { Text("Test pinned ${extensionName} update") }
                        TextButton(onClick = { failNextPopupForTest = true }) {
                            Text("Test ${extensionName} popup failure")
                        }
                        TextButton(onClick = { failNextMutationForTest = true }) {
                            Text("Test ${extensionName} mutation failure")
                        }
                        TextButton(onClick = { failNextUpdateForTest = true }) {
                            Text("Test ${extensionName} update failure")
                        }
                        TextButton(onClick = {
                            val extension = csfloatExtensionRef ?: return@TextButton
                            failNextCleanupForTest = true
                            cleanupCsfloat(
                                listOf(extension),
                                "${extensionName}: test cleanup complete; extension absent; browsing restored.",
                            )
                        }) {
                            Text("Test ${extensionName} cleanup failure")
                        }
                    }
                    if (popupState == CsfloatPopupState.FAILED) {
                        TextButton(onClick = {
                            popupStatus.recover()
                            renderPopupStatus()
                            val targets = pendingCleanup
                            val mutation = pendingMutationEnable
                            if (mutation != null) mutateCsfloat(mutation)
                            else if (pendingUpdateRecovery) {
                                recoverUpdateFailure()
                            }
                            else if (pendingDeniedVerification) verifyDeniedCsfloat()
                            else if (targets.isEmpty()) discoverCsfloat()
                            else cleanupCsfloat(targets, pendingCleanupSuccess)
                        }) {
                            Text("Retry ${extensionName}")
                        }
                    }
                    if (popupState == CsfloatPopupState.OPENED) {
                        TextButton(onClick = { trackingState = CsfloatTrackingState.ACTIVE }) {
                            Text("Record visible ${extensionName} tracking active")
                        }
                    }
                    if (debugBuild && trackingState != CsfloatTrackingState.FAILED) {
                        TextButton(onClick = {
                            trackingState = CsfloatTrackingState.FAILED
                            popupStatus.discoveryFailed()
                            renderPopupStatus()
                            csfloatState = "${extensionName}: background tracking failed. Retry inspection."
                        }) { Text("Test ${extensionName} background failure") }
                    }
                    if (debugBuild) {
                        TextButton(onClick = {
                            Handler(Looper.getMainLooper()).postDelayed({ Thread.sleep(15_000) }, 100)
                        }) { Text("Test unresponsive browser worker") }
                        TextButton(onClick = {
                            val activity = context.findActivity() ?: return@TextButton
                            csfloatState = "${extensionName}: recreating activity…"
                            activity.intent.putExtra(DEBUG_ACTIVITY_RECREATED, true)
                            Handler(Looper.getMainLooper()).postDelayed(
                                { activity.recreate() },
                                500,
                            )
                        }) {
                            Text("Test activity recreation")
                        }
                        if (activityRecreatedForTest) Text("${extensionName} test: activity recreated")
                    }
                }
                Text(
                    if (updatePinned) {
                        "${extensionName} update denied: reviewed version ${extensionPackage.VERSION} remains pinned."
                    } else {
                        "${extensionName} update policy: reviewed version ${extensionPackage.VERSION} is pinned; updates require review."
                    },
                    Modifier.padding(8.dp),
                )
                updateTestState?.let { Text(it, Modifier.padding(horizontal = 8.dp)) }
                }
            }
        }
        if (loading) {
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier.fillMaxWidth().height(2.dp),
            )
        }
        Box(Modifier.fillMaxSize()) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { viewContext ->
                    val geckoView = GeckoView(viewContext).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT,
                        )
                    }
                    val session = GeckoSession()
                    session.navigationDelegate = object : GeckoSession.NavigationDelegate {
                        override fun onCanGoBack(session: GeckoSession, value: Boolean) {
                            canGoBack = value
                        }

                        override fun onCanGoForward(session: GeckoSession, value: Boolean) {
                            canGoForward = value
                        }

                        override fun onLocationChange(
                            session: GeckoSession,
                            url: String?,
                            perms: List<GeckoSession.PermissionDelegate.ContentPermission>,
                            hasUserGesture: Boolean,
                        ) {
                            url?.let {
                                currentUrl = it
                                if (it == "about:blank" && cleanupBlanking) {
                                    cleanupBlanking = false
                                } else if (policy.decideNavigation(it) == WebsitePolicy.NavigationDecision.ALLOW_IN_APP) {
                                    val scheme = Uri.parse(it).scheme
                                    if (scheme == "http" || scheme == "https") safeRecoveryUrl = it
                                }
                            }
                        }

                        override fun onLoadRequest(
                            session: GeckoSession,
                            request: GeckoSession.NavigationDelegate.LoadRequest,
                        ): GeckoResult<AllowOrDeny> {
                            if (csfloatQuarantined) {
                                return GeckoResult.fromValue(
                                    if (request.uri == "about:blank") AllowOrDeny.ALLOW else AllowOrDeny.DENY,
                                )
                            }
                            if (cleanupBlanking && request.uri == "about:blank") {
                                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
                            }
                            val decision = policy.decideNavigation(request.uri)
                            if (decision == WebsitePolicy.NavigationDecision.OFFER_EXTERNAL) {
                                blockedUri = Uri.parse(request.uri)
                            } else if (decision == WebsitePolicy.NavigationDecision.REJECT) {
                                error = REJECTED_NAVIGATION_MESSAGE
                            }
                            if (decision == WebsitePolicy.NavigationDecision.ALLOW_IN_APP &&
                                request.target == GeckoSession.NavigationDelegate.TARGET_WINDOW_NEW
                            ) {
                                Handler(Looper.getMainLooper()).post { session.loadUri(request.uri) }
                                return GeckoResult.fromValue(AllowOrDeny.DENY)
                            }
                            return GeckoResult.fromValue(
                                if (decision == WebsitePolicy.NavigationDecision.ALLOW_IN_APP) {
                                    AllowOrDeny.ALLOW
                                } else {
                                    AllowOrDeny.DENY
                                },
                            )
                        }

                        override fun onLoadError(
                            session: GeckoSession,
                            uri: String?,
                            webRequestError: WebRequestError,
                        ): GeckoResult<String>? {
                            error = if (
                                uri != null &&
                                policy.decideNavigation(uri) == WebsitePolicy.NavigationDecision.REJECT
                            ) {
                                REJECTED_NAVIGATION_MESSAGE
                            } else {
                                failedUrl = uri
                                "This website could not be reached."
                            }
                            return null
                        }
                    }
                    session.progressDelegate = object : GeckoSession.ProgressDelegate {
                        override fun onPageStart(session: GeckoSession, url: String) {
                            loading = true
                            progress = 0f
                            error = null
                            failedUrl = null
                        }

                        override fun onProgressChange(session: GeckoSession, value: Int) {
                            progress = value.coerceIn(0, 100) / 100f
                        }

                        override fun onPageStop(session: GeckoSession, success: Boolean) {
                            loading = false
                            if (!success && error == null) error = "This website could not be reached."
                        }
                    }
                    session.contentDelegate = object : GeckoSession.ContentDelegate {
                        override fun onTitleChange(session: GeckoSession, value: String?) {
                            title = value?.takeIf { it.isNotBlank() } ?: websiteId
                        }
                    }

                    session.open(runtime)
                    geckoView.setSession(session)
                    runtime.webExtensionController.setTabActive(session, true)
                    sessionRef = session
                    if (extensionsEnabled) {
                        runtime.webExtensionController.promptDelegate = promptDelegate
                        discoverCsfloat()
                    }
                    if (steamFeaturesEnabled) {
                        runtime.webExtensionController.ensureBuiltIn(DETECTOR_URI, DETECTOR_EXTENSION_ID).accept(
                            { extension -> geckoView.post {
                                if (sessionRef === session && extension?.id == DETECTOR_EXTENSION_ID) {
                                    detectorExtensionRef = extension
                                    session.webExtensionController.setMessageDelegate(
                                        extension,
                                        detectorDelegate(extension, session, accountId, context.applicationContext),
                                        DETECTOR_NATIVE_APP,
                                    )
                                }
                                detectorReady = true
                                maybeLoadInitialPage()
                            } },
                            { geckoView.post {
                                if (sessionRef === session) {
                                    error = "Steam profile image detection is unavailable. You can still sign in and browse."
                                    detectorReady = true
                                    maybeLoadInitialPage()
                                }
                            } },
                        )
                    } else {
                        maybeLoadInitialPage()
                    }
                    geckoView
                },
                onRelease = { view ->
                    releaseCsfloatOperation(operationToken)
                    installPromptResult?.complete(WebExtension.PermissionPromptResponse(false, false, false))
                    installPromptResult = null
                    installPromptText = null
                    runtime.webExtensionController.promptDelegate = null
                    clearCsfloat()
                    tempXpi?.delete()
                    tempXpi = null
                    detectorExtensionRef?.let { extension ->
                        sessionRef?.webExtensionController?.setMessageDelegate(
                            extension,
                            null,
                            DETECTOR_NATIVE_APP,
                        )
                    }
                    detectorExtensionRef = null
                    sessionRef?.let { session ->
                        runtime.webExtensionController.setTabActive(session, false)
                        view.releaseSession()
                        session.close()
                    }
                    sessionRef = null
                },
            )
            error?.let { message ->
                Box(
                    Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(message, modifier = Modifier.padding(20.dp))
                        TextButton(onClick = {
                            val retryUrl = failedUrl
                            error = null
                            if (retryUrl != null) sessionRef?.loadUri(retryUrl) else sessionRef?.reload()
                        }) { Text("Try again") }
                    }
                }
            }
        }
    }

    blockedUri?.let { uri ->
        AlertDialog(
            onDismissRequest = { blockedUri = null },
            title = { Text("Leaving this website") },
            text = { Text("This link goes outside the allowed domains. Open it in your browser instead?") },
            confirmButton = {
                TextButton(onClick = { blockedUri = null; openExternal(uri) }) { Text("Open externally") }
            },
            dismissButton = { TextButton(onClick = { blockedUri = null }) { Text("Stay here") } },
        )
    }

    installPromptText?.let { prompt ->
        AlertDialog(
            onDismissRequest = {
                installDenied = true
                installPromptResult?.complete(WebExtension.PermissionPromptResponse(false, false, false))
                installPromptResult = null
                installPromptText = null
                csfloatState = "${extensionName}: consent denied; browsing remains available."
            },
            title = { Text("Install-time ${extensionName} access request") },
            text = { Text(prompt, Modifier.verticalScroll(rememberScrollState())) },
            confirmButton = {
                TextButton(onClick = {
                    installDenied = false
                    if (extensionPackage === BrowserExtensionPackages.CSMONEY && android.os.Build.VERSION.SDK_INT >= 33 &&
                        context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED
                    ) {
                        context.findActivity()?.requestPermissions(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 730)
                    }
                    installPromptResult?.complete(
                        WebExtension.PermissionPromptResponse(true, false, false),
                    )
                    installPromptResult = null
                    installPromptText = null
                }) { Text("Accept ${extensionName} access") }
            },
            dismissButton = {
                TextButton(onClick = {
                    installDenied = true
                    installPromptResult?.complete(WebExtension.PermissionPromptResponse(false, false, false))
                    installPromptResult = null
                    installPromptText = null
                    csfloatState = "${extensionName}: consent denied; browsing remains available."
                }) { Text("Deny ${extensionName} access") }
            },
        )
    }

    optionalPromptText?.let { prompt ->
        fun respond(allow: Boolean) {
            val result = optionalPromptResult
            optionalPromptResult = null
            optionalPromptText = null
            result?.complete(if (allow && !csfloatQuarantined && csfloatExtensionRef != null) {
                AllowOrDeny.ALLOW
            } else AllowOrDeny.DENY)
        }
        AlertDialog(
            onDismissRequest = { respond(false) },
            title = { Text("Additional $extensionName access") },
            text = { Text(prompt, Modifier.verticalScroll(rememberScrollState())) },
            confirmButton = { TextButton(onClick = { respond(true) }) { Text("Allow requested access") } },
            dismissButton = { TextButton(onClick = { respond(false) }) { Text("Deny requested access") } },
        )
    }
    if (showWebsiteAccess) {
        val installed = csfloatExtensionRef
        AlertDialog(
            onDismissRequest = { showWebsiteAccess = false },
            title = { Text("$extensionName website access") },
            text = {
                Text(extensionPackage.prompt(
                    extensionName, extensionPackage.ID, extensionPackage.VERSION, emptyList(),
                    installed?.metaData?.optionalOrigins?.toList().orEmpty(), emptyList(),
                ), Modifier.verticalScroll(rememberScrollState()))
            },
            confirmButton = {
                TextButton(onClick = { showWebsiteAccess = false; changeWebsiteAccess(true) }) { Text("Allow listed websites") }
            },
            dismissButton = {
                TextButton(onClick = { showWebsiteAccess = false; changeWebsiteAccess(false) }) { Text("Revoke listed access") }
            },
        )
    }

}

internal fun tryPersistDetectorConsent(persist: () -> Boolean): Boolean = try {
    persist()
} catch (_: RuntimeException) {
    false
}

private fun detectorDelegate(
    extension: WebExtension,
    selectedSession: GeckoSession,
    accountId: String,
    appContext: android.content.Context,
) = object : WebExtension.MessageDelegate {
    override fun onConnect(port: WebExtension.Port) {
        val sender = port.sender
        val senderIsValid = port.name == DETECTOR_NATIVE_APP &&
            sender.webExtension.id == DETECTOR_EXTENSION_ID && sender.webExtension.id == extension.id &&
            sender.environmentType == WebExtension.MessageSender.ENV_TYPE_CONTENT_SCRIPT &&
            sender.session === selectedSession && sender.isTopLevel &&
            SteamLoginDetector.looksLikeLoggedInSteamPage(sender.url)
        if (!senderIsValid) {
            port.disconnect()
            return
        }
        port.setDelegate(object : WebExtension.PortDelegate {
            override fun onPortMessage(message: Any, sourcePort: WebExtension.Port) {
                try {
                    if (sourcePort !== port || message !is JSONObject || message.optString("type") != "profile") return
                    val allowedKeys = setOf("type", "avatarUrl", "profileUrl")
                    val keys = message.keys().asSequence().toSet()
                    if (keys != allowedKeys) return
                    SteamLoginDetector.parseResult(message.toString())?.let {
                        SteamLoginDetector.sendResult(it, accountId, appContext)
                    }
                } finally {
                    sourcePort.disconnect()
                }
            }
        })
    }
}

private const val DETECTOR_URI = "resource://android/assets/steam-profile-detector/"
private const val DETECTOR_EXTENSION_ID = "steam-profile-detector@steam-account-manager.invalid"
private const val DETECTOR_NATIVE_APP = "steamProfileDetector"
private const val REJECTED_NAVIGATION_MESSAGE = "This link cannot be opened safely. You can stay here and try another link."

internal fun csfloatInstallEnabled(trustInspectionComplete: Boolean, quarantined: Boolean) =
    trustInspectionComplete && !quarantined

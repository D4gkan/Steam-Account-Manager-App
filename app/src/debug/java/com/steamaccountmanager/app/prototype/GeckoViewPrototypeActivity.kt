package com.steamaccountmanager.app.prototype

import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.app.Dialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity
import com.steamaccountmanager.app.browser.WebsitePolicy
import com.steamaccountmanager.app.domain.model.BuiltInWebsites
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebExtension
import org.mozilla.geckoview.WebExtensionController
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.InetAddress
import java.net.URI
import java.net.ServerSocket
import java.nio.charset.StandardCharsets
import java.util.concurrent.Executors

class GeckoViewPrototypeActivity : ComponentActivity() {
    private lateinit var runtime: GeckoRuntime
    private lateinit var session: GeckoSession
    private lateinit var status: TextView
    private lateinit var installButton: Button
    private lateinit var trackingStatus: TextView
    private lateinit var actionButton: Button
    private lateinit var recordStatusButton: Button
    private lateinit var simulateFailureButton: Button
    private lateinit var recoverButton: Button
    private lateinit var markerStatus: TextView
    private lateinit var engineStatus: TextView
    private lateinit var extensionState: TextView
    private lateinit var markerExtensionState: TextView
    private lateinit var navigationStatus: TextView
    private lateinit var backButton: Button
    private lateinit var forwardButton: Button
    private lateinit var stayButton: Button
    private lateinit var openExternalButton: Button
    private lateinit var slot: String
    private lateinit var profileId: String
    private var installDenied = false
    private var installFailure = PrototypeDiagnostic.INSTALL_FAILED
    private val tracking = PrototypeTracking()
    private var boundExtension: WebExtension? = null
    private var defaultAction: WebExtension.Action? = null
    private var sessionAction: WebExtension.Action? = null
    private var effectiveAction: WebExtension.Action? = null
    private var popupDialog: Dialog? = null
    private var popupView: GeckoView? = null
    private var popupSession: GeckoSession? = null
    private var pendingPopupRequestId: Long? = null
    private var markerExtension: WebExtension? = null
    private var markerPort: WebExtension.Port? = null
    private var markerReadPort: WebExtension.Port? = null
    private val markerButtons = mutableListOf<Button>()
    private var csfloatMutationInFlight = false
    private var blockedExternalUri: Uri? = null
    private var forceMissingExternalHandler = false
    private var navigationTestLoading = false
    private var reloading = false
    private var sameWindowLoading = false

    private val navigationDelegate = object : GeckoSession.NavigationDelegate {
        override fun onCanGoBack(session: GeckoSession, canGoBack: Boolean) {
            backButton.isEnabled = canGoBack
        }

        override fun onCanGoForward(session: GeckoSession, canGoForward: Boolean) {
            forwardButton.isEnabled = canGoForward
        }

        override fun onLocationChange(
            session: GeckoSession,
            url: String?,
            perms: List<GeckoSession.PermissionDelegate.ContentPermission>,
            hasUserGesture: Boolean,
        ) {
            when (url) {
                prototypeFixtureUri(slot), "${prototypeFixtureUri(slot)}#$slot-history" -> navigationStatus.text = "GV7-NAV-BASE"
                prototypeFixtureUri(slot, true), "${prototypeFixtureUri(slot, true)}#$slot-history" -> navigationStatus.text = "GV7-NAV-NEXT"
                else -> return
            }
            navigationStatus.visibility = TextView.VISIBLE
        }

        override fun onLoadRequest(
            session: GeckoSession,
            request: GeckoSession.NavigationDelegate.LoadRequest,
        ): GeckoResult<AllowOrDeny> {
            val allowed = isPrototypeNavigationAllowed(request.uri, slot)
            if (!allowed) runOnUiThread { showBlockedNavigation(request.uri) }
            if (allowed && request.target == GeckoSession.NavigationDelegate.TARGET_WINDOW_NEW) {
                sameWindowLoading = true
                Handler(Looper.getMainLooper()).post {
                    if (!isDestroyed) session.loadUri(request.uri)
                }
                return GeckoResult.fromValue(AllowOrDeny.DENY)
            }
            return GeckoResult.fromValue(if (allowed) AllowOrDeny.ALLOW else AllowOrDeny.DENY)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (shutdownRequested) {
            finish()
            return
        }

        slot = intent.getStringExtra(EXTRA_SLOT).takeIf { it == "A" || it == "B" } ?: run {
            finish()
            return
        }
        profileId = slotProfileId(slot)

        status = TextView(this).apply {
            text = "Ready to install. The public Steam listing is loading."
            setPadding(24, 16, 24, 16)
        }
        installButton = Button(this).apply {
            text = "Review and install CSFloat"
            setOnClickListener { installExtension() }
        }
        trackingStatus = TextView(this).apply { setPadding(24, 8, 24, 8) }
        actionButton = Button(this).apply {
            text = "Open official CSFloat action"
            setOnClickListener { requestAction() }
        }
        recordStatusButton = Button(this).apply {
            text = "Record visible official status"
            setOnClickListener {
                tracking.recordVisibleOfficialStatus()
                renderTracking()
            }
        }
        simulateFailureButton = Button(this).apply {
            text = "Simulate popup failure (test only)"
            setOnClickListener {
                closePopup()
                pendingPopupRequestId = null
                tracking.simulatePopupFailure()
                renderTracking()
            }
        }
        recoverButton = Button(this).apply {
            text = "Recover and rediscover CSFloat"
            setOnClickListener {
                closePopup()
                pendingPopupRequestId = null
                tracking.recover()
                renderTracking()
                discoverAction()
            }
        }
        markerStatus = TextView(this).apply {
            text = "GV-MARKER-WAIT slot=$slot profile=$profileId"
            setPadding(24, 8, 24, 8)
        }
        engineStatus = TextView(this).apply {
            text = "GV6|loading"
            setPadding(24, 8, 24, 8)
        }
        extensionState = TextView(this).apply {
            text = "GV-CSFLOAT-STATE-UNKNOWN"
            setPadding(24, 8, 24, 8)
        }
        markerExtensionState = TextView(this).apply {
            text = "GV-MARKER-STATE-UNKNOWN slot=$slot profile=$profileId"
            setPadding(24, 8, 24, 8)
        }
        navigationStatus = TextView(this).apply {
            visibility = TextView.GONE
            setPadding(24, 8, 24, 8)
        }
        openExternalButton = Button(this).apply {
            text = "Open in external browser"
            visibility = Button.GONE
            setOnClickListener {
                blockedExternalUri?.let { uri ->
                    openExternal(uri, forceMissingExternalHandler)
                    forceMissingExternalHandler = false
                }
            }
        }
        stayButton = Button(this).apply {
            text = "Stay here"
            visibility = Button.GONE
            setOnClickListener { clearBlockedNavigation() }
        }
        backButton = button("Back") { session.goBack() }.apply { isEnabled = false }
        forwardButton = button("Forward") { session.goForward() }.apply { isEnabled = false }
        val metadata = TextView(this).apply {
            text = ARTIFACT_METADATA
            setPadding(24, 8, 24, 12)
            setTextIsSelectable(true)
        }
        val geckoView = GeckoView(this)
        val controls = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                addView(status)
                addView(backButton)
                addView(forwardButton)
                addView(button("Reload") {
                    reloading = true
                    navigationStatus.text = "GV-NAVIGATION-RELOADING"
                    navigationStatus.visibility = TextView.VISIBLE
                    session.reload()
                })
                addView(button("Test allowed navigation") {
                    navigationTestLoading = true
                    session.loadUri(prototypeFixtureUri(slot, true))
                })
                addView(button("Test blocked navigation") { session.loadUri(BLOCKED_TEST_URL) })
                addView(button("Test unavailable external handoff") {
                    forceMissingExternalHandler = true
                    showBlockedNavigation(BLOCKED_TEST_URL)
                })
                addView(navigationStatus)
                addView(stayButton)
                addView(openExternalButton)
                addView(markerStatus)
                addView(engineStatus)
                addView(installButton)
                addView(trackingStatus)
                addView(actionButton)
                addView(recordStatusButton)
                addView(simulateFailureButton)
                addView(recoverButton)
                addView(button("Open synthetic isolation marker") { loadSyntheticMarker() })
                addView(button("Open public Steam listing") { session.loadUri(STEAM_LISTING_URL) })
                addView(button("Open public Steam listing in external browser") {
                    forceMissingExternalHandler = false
                    openExternal(Uri.parse(STEAM_LISTING_URL))
                })
                addView(button("Recreate worker activity") { recreate() })
                addView(button("Close worker screen") { finish() })
                addView(extensionState)
                addView(button("Disable CSFloat") { changeCsfloat("disable") })
                addView(button("Enable CSFloat") { changeCsfloat("enable") })
                addView(button("Uninstall CSFloat") { changeCsfloat("uninstall") })
                addView(button("Reinstall CSFloat with consent") { reinstallExtension() })
                addView(markerExtensionState)
                addView(button("Disable issue6 marker") { changeMarker("disable") }.also { markerButtons.add(it) })
                addView(button("Enable issue6 marker") { changeMarker("enable") }.also { markerButtons.add(it) })
                addView(button("Uninstall issue6 marker") { changeMarker("uninstall") }.also { markerButtons.add(it) })
                addView(button("Reinstall issue6 marker (synthetic only)") { changeMarker("reinstall") }.also { markerButtons.add(it) })
                addView(metadata)
        }
        setContentView(
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                addView(ScrollView(this@GeckoViewPrototypeActivity).apply { addView(controls) },
                    LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
                addView(
                    geckoView,
                    LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        0,
                        1f,
                    ),
                )
            },
        )

        if (!PrototypeLoopbackServer.start()) {
            status.text = "GV-LOOPBACK-START-FAILED: Synthetic fixture unavailable."
            finish()
            return
        }

        val root = File(noBackupFilesDir, "gecko-prototype-profiles").toPath()
        val profile = requireContainedProfilePath(root, root.resolve(profileId)).toFile().apply { mkdirs() }
        val existing = sharedRuntime
        if (existing != null && sharedProfileId != profileId) {
            status.text = "GV-PROFILE-MISMATCH: Worker restart required."
            finish()
            return
        }
        runtime = existing ?: GeckoRuntime.create(
            applicationContext,
            GeckoRuntimeSettings.Builder()
                .arguments(arrayOf("--profile", profile.absolutePath))
                .build(),
        ).also {
            sharedRuntime = it
            sharedProfileId = profileId
        }
        currentActivity = this
        runtime.webExtensionController.promptDelegate = InstallConsentPrompt()
        session = GeckoSession().apply {
            configureSession(this)
            open(runtime)
            loadUri(prototypeFixtureUri(slot))
        }
        geckoView.setSession(session)
        runtime.webExtensionController.setTabActive(session, true)
        renderTracking()
        discoverAction()
        discoverMarkerExtension()
        refreshCsfloatState()
    }

    override fun onDestroy() {
        if (!::runtime.isInitialized || !::session.isInitialized) {
            super.onDestroy()
            return
        }
        closePopup()
        clearActionDelegates()
        markerPort?.setDelegate(RETIRED_MARKER_PORT_DELEGATE)
        markerPort = null
        markerReadPort = null
        if (ownsRuntime()) markerExtension?.setMessageDelegate(null, MARKER_NATIVE_APP)
        markerExtension = null
        if (ownsRuntime()) {
            runtime.webExtensionController.promptDelegate = null
            currentActivity = null
        }
        runtime.webExtensionController.setTabActive(session, false)
        session.close()
        super.onDestroy()
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        setOnClickListener { action() }
    }

    private fun ownsRuntime() = currentActivity === this

    private fun withCurrentActivity(action: () -> Unit) = runOnUiThread {
        if (ownsRuntime() && !isDestroyed) action()
    }

    private fun loadSyntheticMarker() {
        session.loadUri(prototypeFixtureUri(slot))
    }

    private fun configureSession(target: GeckoSession) {
        target.navigationDelegate = navigationDelegate
        target.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onPageStop(session: GeckoSession, success: Boolean) = runOnUiThread {
                if (!success) status.text = PrototypeDiagnostic.PAGE_LOAD_FAILED.message
                else if (sameWindowLoading) {
                    sameWindowLoading = false
                    status.text = "GV-NAVIGATION-SAME-WINDOW"
                } else if (navigationTestLoading) {
                    navigationTestLoading = false
                    navigationStatus.text = "GV-NAVIGATION-TEST-READY"
                    navigationStatus.visibility = TextView.VISIBLE
                } else if (reloading) {
                    reloading = false
                    navigationStatus.text = "GV-NAVIGATION-RELOADED"
                }
            }
        }
        target.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onTitleChange(session: GeckoSession, title: String?) {
                if (title?.matches(Regex("^GV6\\|slot=[AB]\\|cookie=[AB]\\|local=[AB]\\|idb=[AB]\\|nav=[AB]-history$")) == true) {
                    runOnUiThread { engineStatus.text = title }
                }
            }
        }
    }

    private fun openExternal(uri: Uri, missingHandler: Boolean = false) {
        if (!isPrototypeExternalHandoffEligible(uri.toString())) return
        val intent = Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)
        if (missingHandler) intent.setPackage(MISSING_BROWSER_PACKAGE)
        try {
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            showExternalUnavailable()
        } catch (_: SecurityException) {
            showExternalUnavailable()
        }
    }

    private fun showExternalUnavailable() {
        navigationStatus.text = PROTOTYPE_EXTERNAL_HANDOFF_UNAVAILABLE_MESSAGE
        navigationStatus.visibility = TextView.VISIBLE
        stayButton.visibility = Button.VISIBLE
        blockedExternalUri = null
        openExternalButton.visibility = Button.GONE
    }

    private fun showBlockedNavigation(rawUri: String) {
        navigationStatus.text = PROTOTYPE_NAVIGATION_BLOCKED_MESSAGE
        navigationStatus.visibility = TextView.VISIBLE
        stayButton.visibility = Button.VISIBLE
        blockedExternalUri = Uri.parse(rawUri).takeIf { isPrototypeExternalHandoffEligible(rawUri) }
        openExternalButton.visibility = if (blockedExternalUri == null) Button.GONE else Button.VISIBLE
    }

    private fun clearBlockedNavigation() {
        blockedExternalUri = null
        navigationStatus.visibility = TextView.GONE
        stayButton.visibility = Button.GONE
        openExternalButton.visibility = Button.GONE
    }

    private fun discoverMarkerExtension() {
        if (!ownsRuntime()) return
        markerButtons.forEach { it.isEnabled = false }
        markerExtensionState.text = "GV-MARKER-STATE-BUSY slot=$slot"
        markerStatus.text = "GV-MARKER-WAIT slot=$slot"
        if (pendingMarker == null && !shutdownRequested) beginMarkerOperation(runtime, "discover")
    }

    private fun changeMarker(operation: String) {
        if (!ownsRuntime() || shutdownRequested || pendingMarker != null) return
        beginMarkerOperation(runtime, operation)
    }

    private fun renderMarkerState(extension: WebExtension?) {
        if (extension == null) {
            markerPort?.setDelegate(RETIRED_MARKER_PORT_DELEGATE)
            markerPort = null
            markerExtension?.setMessageDelegate(null, MARKER_NATIVE_APP)
        } else {
            extension.setMessageDelegate(markerMessageDelegate, MARKER_NATIVE_APP)
        }
        markerExtension = extension
        markerExtensionState.text = when {
            extension == null -> "GV-MARKER-STATE-ABSENT slot=$slot profile=$profileId"
            extension.metaData.enabled -> "GV-MARKER-STATE-ENABLED slot=$slot profile=$profileId version=${extension.metaData.version}"
            else -> "GV-MARKER-STATE-DISABLED slot=$slot profile=$profileId version=${extension.metaData.version}"
        }
    }

    private fun readVerifiedMarker() {
        val port = markerPort ?: return
        if (!ownsRuntime() || pendingMarker != null || shutdownRequested ||
            markerExtension?.metaData?.enabled != true || markerReadPort === port) return
        markerReadPort = port
        port.postMessage(JSONObject().put("type", "read").put("slot", slot))
    }

    private val markerMessageDelegate = object : WebExtension.MessageDelegate {
        override fun onConnect(port: WebExtension.Port) {
            if (!ownsRuntime()) return
            val sender = port.sender
            if (port.name != MARKER_NATIVE_APP || sender.webExtension.id != MARKER_EXTENSION_ID ||
                sender.environmentType != WebExtension.MessageSender.ENV_TYPE_EXTENSION
            ) {
                withCurrentActivity { markerStatus.text = "GV-MARKER-SCHEMA-REJECTED slot=$slot" }
                port.disconnect()
                return
            }
            markerPort = port
            port.setDelegate(object : WebExtension.PortDelegate {
                override fun onPortMessage(message: Any, port: WebExtension.Port) {
                    if (!ownsRuntime()) return
                    if (port !== markerPort || port !== markerReadPort || pendingMarker != null) return
                    if (message !is JSONObject || message.optString("type") != "result") {
                        withCurrentActivity { markerStatus.text = "GV-MARKER-SCHEMA-REJECTED slot=$slot" }
                        return
                    }
                    val reportedSlot = message.optString("slot")
                    val prior = message.optString("prior")
                    val current = message.optString("current")
                    if (reportedSlot == slot && prior in setOf("A", "B") && current in setOf("A", "B")) {
                        withCurrentActivity {
                            markerStatus.text = "GV-MARKER-RESULT slot=$slot prior=$prior current=$current profile=$profileId"
                        }
                    }
                }
                override fun onDisconnect(port: WebExtension.Port) {
                    if (port === markerPort) markerPort = null
                    if (port === markerReadPort) markerReadPort = null
                }
            })
            readVerifiedMarker()
        }
    }

    private fun refreshCsfloatState(after: ((Boolean) -> Unit)? = null) {
        runtime.webExtensionController.list().accept(
            { extensions -> runOnUiThread {
                val exact = extensions.orEmpty().singleOrNull { isExpectedCsfloat(it.id, it.metaData.version) }
                val enabled = exact?.metaData?.enabled == true
                extensionState.text = when {
                    exact == null -> "GV-CSFLOAT-STATE-ABSENT slot=$slot"
                    enabled -> "GV-CSFLOAT-STATE-ENABLED slot=$slot"
                    else -> "GV-CSFLOAT-STATE-DISABLED slot=$slot"
                }
                if (!enabled) revokeOfficialAction()
                after?.invoke(enabled)
            } },
            { runOnUiThread {
                extensionState.text = "GV-CSFLOAT-STATE-FAILED"
                revokeOfficialAction()
                after?.invoke(false)
            } },
        )
    }

    private fun changeCsfloat(operation: String) {
        if (csfloatMutationInFlight || operation !in setOf("disable", "enable", "uninstall")) return
        csfloatMutationInFlight = true
        runtime.webExtensionController.list().accept(
            { extensions -> runOnUiThread {
                val target = extensions.orEmpty().singleOrNull {
                    if (operation == "enable") isExpectedCsfloat(it.id, it.metaData.version)
                    else isCsfloatRevocationTarget(it.id)
                }
                if (target == null) {
                    extensionState.text = if (operation == "enable" && extensions.orEmpty().any {
                            isCsfloatRevocationTarget(it.id)
                        }
                    ) "GV-CSFLOAT-STATE-FAILED" else "GV-CSFLOAT-STATE-ABSENT slot=$slot"
                    revokeOfficialAction()
                    csfloatMutationInFlight = false
                } else {
                    val result = when (operation) {
                        "disable" -> runtime.webExtensionController.disable(target, WebExtensionController.EnableSource.APP)
                        "enable" -> runtime.webExtensionController.enable(target, WebExtensionController.EnableSource.APP)
                        "uninstall" -> runtime.webExtensionController.uninstall(target).map { target }
                        else -> error("unreachable")
                    }
                    result.accept(
                        { runOnUiThread {
                            if (operation != "enable") revokeOfficialAction()
                            refreshCsfloatState { enabled ->
                                csfloatMutationInFlight = false
                                if (operation == "enable" && enabled) discoverAction()
                            }
                        } },
                        { runOnUiThread {
                            csfloatMutationInFlight = false
                            extensionState.text = "GV-CSFLOAT-STATE-FAILED"
                            revokeOfficialAction()
                        } },
                    )
                }
            } },
            { runOnUiThread {
                csfloatMutationInFlight = false
                extensionState.text = "GV-CSFLOAT-STATE-FAILED"
                revokeOfficialAction()
            } },
        )
    }

    private fun reinstallExtension() {
        if (csfloatMutationInFlight) return
        csfloatMutationInFlight = true
        revokeOfficialAction()
        runtime.webExtensionController.list().accept(
            { extensions -> runOnUiThread {
                if (extensions == null) return@runOnUiThread failCsfloatCleanup()
                val installed = extensions.singleOrNull { isCsfloatRevocationTarget(it.id) }
                if (installed == null) {
                    csfloatMutationInFlight = false
                    installExtension()
                } else runtime.webExtensionController.uninstall(installed).accept(
                    { verifyCsfloatRevokedThenInstall() },
                    { runOnUiThread { failCsfloatCleanup() } },
                )
            } },
            { runOnUiThread { failCsfloatCleanup() } },
        )
    }

    private fun verifyCsfloatRevokedThenInstall() {
        runtime.webExtensionController.list().accept(
            { extensions -> runOnUiThread {
                if (extensions == null || extensions.any {
                        isCsfloatRevocationTarget(it.id) && it.metaData.enabled
                    }
                ) failCsfloatCleanup()
                else {
                    csfloatMutationInFlight = false
                    installExtension()
                }
            } },
            { runOnUiThread { failCsfloatCleanup() } },
        )
    }

    private fun failCsfloatCleanup() {
        csfloatMutationInFlight = false
        extensionState.text = "GV-CSFLOAT-STATE-FAILED"
        status.text = PrototypeDiagnostic.CLEANUP_FAILED.message
        revokeOfficialAction()
    }

    private fun installExtension() {
        installButton.isEnabled = false
        installDenied = false
        installFailure = PrototypeDiagnostic.INSTALL_FAILED
        status.text = "Installing signed CSFloat package…"
        runtime.webExtensionController.install(
            CSFLOAT_XPI_URL,
            WebExtensionController.INSTALLATION_METHOD_MANAGER,
        ).accept(
            { extension ->
                runOnUiThread {
                    if (installDenied) {
                        verifyDeniedState()
                    } else extension?.let(::showInstalled) ?: run {
                        status.text = PrototypeDiagnostic.INSTALL_NO_RESULT.message
                        installButton.isEnabled = true
                    }
                }
            },
            {
                runOnUiThread {
                    if (installDenied) {
                        verifyDeniedState()
                    } else {
                        status.text = installFailure.message
                        installButton.isEnabled = true
                    }
                }
            },
        )
    }

    private fun showInstalled(extension: WebExtension) {
        if (isExpectedCsfloat(extension.id, extension.metaData.version)) {
            status.text = "Installed and ready: $CSFLOAT_NAME $CSFLOAT_VERSION; " +
                "GeckoView signed state ${extension.metaData.signedState}. Reloading the listing for injection."
            installButton.isEnabled = false
            session.reload()
            discoverAction()
            refreshCsfloatState()
            return
        }

        runtime.webExtensionController.uninstall(extension).accept(
            {
                runOnUiThread {
                    status.text = PrototypeDiagnostic.PACKAGE_MISMATCH.message
                    installButton.isEnabled = true
                }
            },
            {
                runOnUiThread {
                    status.text = PrototypeDiagnostic.CLEANUP_FAILED.message
                    installButton.isEnabled = false
                }
            },
        )
    }

    private fun verifyDeniedState() {
        runtime.webExtensionController.list().accept(
            { extensions ->
                runOnUiThread {
                    if (extensions == null) {
                        status.text = PrototypeDiagnostic.DENIAL_QUERY_FAILED.message
                    } else {
                        val expectedStates = extensions
                            .filter { it.id == CSFLOAT_ID }
                            .map { it.metaData.enabled }
                        status.text = denialMessage(denialState(expectedStates))
                    }
                    installButton.isEnabled = true
                }
            },
            {
                runOnUiThread {
                    status.text = PrototypeDiagnostic.DENIAL_QUERY_FAILED.message
                    installButton.isEnabled = true
                }
            },
        )
    }

    private fun discoverAction() {
        if (!ownsRuntime()) return
        pendingPopupRequestId = null
        tracking.unavailable()
        renderTracking()
        runtime.webExtensionController.list().accept(
            { extensions ->
                runOnUiThread {
                    if (extensions == null) {
                        tracking.discoveryFailed()
                        renderTracking()
                        return@runOnUiThread
                    }
                    val extension = extensions.singleOrNull {
                        isEnabledExpectedExtension(it.id, it.metaData.version, it.metaData.enabled)
                    }
                    val bound = boundExtension
                    if (canReuseValidatedAction(
                            bound?.id,
                            bound?.metaData?.version,
                            extension?.id,
                            extension?.metaData?.version,
                            extension?.metaData?.enabled == true,
                            effectiveAction != null,
                        )
                    ) {
                        tracking.actionAvailable()
                        renderTracking()
                    } else if (extension == null) {
                        clearActionDelegates()
                        renderTracking()
                    } else if (extension !== bound) {
                        bindAction(extension)
                    }
                }
            },
            {
                runOnUiThread {
                    tracking.discoveryFailed()
                    renderTracking()
                }
            },
        )
    }

    private fun bindAction(extension: WebExtension) {
        if (!ownsRuntime()) return
        clearActionDelegates()
        boundExtension = extension
        extension.setActionDelegate(actionDelegate)
        session.webExtensionController.setActionDelegate(extension, actionDelegate)
    }

    private fun clearActionDelegates() {
        pendingPopupRequestId = null
        boundExtension?.let { extension ->
            if (ownsRuntime()) extension.setActionDelegate(null)
            session.webExtensionController.setActionDelegate(extension, null)
        }
        boundExtension = null
        defaultAction = null
        sessionAction = null
        effectiveAction = null
    }

    private fun revokeOfficialAction() {
        closePopup()
        clearActionDelegates()
        tracking.unavailable()
        renderTracking()
    }

    private val actionDelegate = object : WebExtension.ActionDelegate {
        override fun onBrowserAction(
            extension: WebExtension,
            callbackSession: GeckoSession?,
            action: WebExtension.Action,
        ) = receiveAction(extension, callbackSession, action)

        override fun onPageAction(
            extension: WebExtension,
            callbackSession: GeckoSession?,
            action: WebExtension.Action,
        ) = receiveAction(extension, callbackSession, action)

        override fun onTogglePopup(
            extension: WebExtension,
            action: WebExtension.Action,
        ): GeckoResult<GeckoSession> {
            val requestId = pendingPopupRequestId
            if (requestId == null || requestId != tracking.inFlightRequestId) {
                return GeckoResult.fromValue(null)
            }
            if (popupSession == null) return openPopup(requestId)
            closePopup()
            if (tracking.popupOpened(requestId)) pendingPopupRequestId = null
            renderTracking()
            return GeckoResult.fromValue(null)
        }

        override fun onOpenPopup(
            extension: WebExtension,
            action: WebExtension.Action,
        ): GeckoResult<GeckoSession> {
            val requestId = pendingPopupRequestId
            if (requestId == null || requestId != tracking.inFlightRequestId) {
                return GeckoResult.fromValue(null)
            }
            // Gecko does not return the originating request token. The single pending
            // dispatch is the only correlatable callback; the reducer rejects explicit stale tokens.
            return openPopup(requestId)
        }
    }

    private fun receiveAction(
        extension: WebExtension,
        callbackSession: GeckoSession?,
        action: WebExtension.Action,
    ) {
        if (!ownsRuntime() || extension !== boundExtension) return
        runOnUiThread {
            if (callbackSession == null) defaultAction = action else sessionAction = action
            val default = defaultAction
            val sessionOverride = sessionAction
            effectiveAction = if (default != null && sessionOverride != null) {
                sessionOverride.withDefault(default)
            } else {
                default
            }
            if (effectiveAction?.enabled == true) tracking.actionAvailable() else tracking.unavailable()
            renderTracking()
        }
    }

    private fun requestAction() {
        val action = effectiveAction ?: return
        tracking.requestAction {
            val requestId = requireNotNull(tracking.inFlightRequestId)
            pendingPopupRequestId = requestId
            try {
                action.click()
            } catch (_: RuntimeException) {
                if (tracking.actionClickFailed(requestId)) pendingPopupRequestId = null
            }
        }
        renderTracking()
    }

    private fun openPopup(requestId: Long): GeckoResult<GeckoSession> = try {
        closePopup()
        val popup = GeckoSession().apply { open(runtime) }
        val view = GeckoView(this).apply {
            minimumHeight = 600
            setSession(popup)
        }
        val dialog = Dialog(this).apply {
            setTitle("Official CSFloat popup")
            setContentView(
                view,
                ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                ),
            )
            setOnDismissListener { closePopup() }
            show()
        }
        popupSession = popup
        popupView = view
        popupDialog = dialog
        if (tracking.popupOpened(requestId)) pendingPopupRequestId = null
        renderTracking()
        GeckoResult.fromValue(popup)
    } catch (_: RuntimeException) {
        if (tracking.popupFailed(requestId)) pendingPopupRequestId = null
        renderTracking()
        GeckoResult.fromException(IllegalStateException("GV-ACTION-FAILED"))
    }

    private fun closePopup() {
        popupDialog?.setOnDismissListener(null)
        popupDialog?.dismiss()
        popupDialog = null
        popupView?.releaseSession()
        popupView = null
        popupSession?.close()
        popupSession = null
    }

    private fun renderTracking() {
        trackingStatus.text = tracking.diagnostic ?: trackingMessage(tracking.state)
        val canAct = tracking.state == TrackingState.READY || tracking.state == TrackingState.ACTIVE
        actionButton.isEnabled = canAct && tracking.inFlightRequestId == null && effectiveAction != null
        recordStatusButton.isEnabled = tracking.state == TrackingState.READY &&
            tracking.inFlightRequestId == null && tracking.officialSurfaceOpened
        simulateFailureButton.isEnabled = tracking.state == TrackingState.READY || tracking.inFlightRequestId != null
        recoverButton.isEnabled = tracking.state == TrackingState.FAILED
    }

    private inner class InstallConsentPrompt : WebExtensionController.PromptDelegate {
        override fun onInstallPromptRequest(
            extension: WebExtension,
            permissions: Array<out String>,
            origins: Array<out String>,
            dataCollectionPermissions: Array<out String>,
        ): GeckoResult<WebExtension.PermissionPromptResponse> {
            val result = GeckoResult<WebExtension.PermissionPromptResponse>()
            if (!ownsRuntime()) {
                result.complete(WebExtension.PermissionPromptResponse(false, false, false))
                return result
            }
            if (!isExpectedCsfloat(extension.id, extension.metaData.version)) {
                runOnUiThread {
                    installFailure = PrototypeDiagnostic.CONSENT_IDENTITY_MISMATCH
                    status.text = installFailure.message
                    installButton.isEnabled = true
                    result.complete(WebExtension.PermissionPromptResponse(false, false, false))
                }
                return result
            }
            val lines = installPrompt(
                extension.metaData.name,
                extension.id,
                extension.metaData.version,
                permissions.toList(),
                origins.toList(),
                dataCollectionPermissions.toList(),
            )

            runOnUiThread {
                AlertDialog.Builder(this@GeckoViewPrototypeActivity)
                    .setTitle("Install-time access request")
                    .setMessage(lines)
                    .setNegativeButton("Deny") { _, _ ->
                        installDenied = true
                        status.text = "Consent denied; checking expected CSFloat state…"
                        result.complete(WebExtension.PermissionPromptResponse(false, false, false))
                    }
                    .setPositiveButton("Accept") { _, _ ->
                        status.text = "Consent accepted. Finishing signed-package installation…"
                        result.complete(
                            WebExtension.PermissionPromptResponse(
                                true,
                                false,
                                dataCollectionPermissions.isNotEmpty(),
                            ),
                        )
                    }
                    .setOnCancelListener {
                        installDenied = true
                        status.text = "Consent denied; checking expected CSFloat state…"
                        result.complete(WebExtension.PermissionPromptResponse(false, false, false))
                    }
                    .show()
            }
            return result
        }
    }

    companion object {
        // Pinned GeckoView 153 can double-close native state when an extension disconnect
        // races app disconnect(). Let the extension close it; this delegate must not capture an Activity.
        private val RETIRED_MARKER_PORT_DELEGATE = object : WebExtension.PortDelegate {}
        private var currentActivity: GeckoViewPrototypeActivity? = null
        var sharedRuntime: GeckoRuntime? = null
        var sharedProfileId: String? = null
        private var shutdownRequested = false
        private var pendingMarker: GeckoResult<WebExtension?>? = null

        // Native operations outlive screens; only delegate/UI delivery looks up the current Activity.
        private fun bindCurrentMarker(runtime: GeckoRuntime, extension: WebExtension) {
            currentActivity?.takeIf { sharedRuntime === runtime && it.runtime === runtime && !it.isDestroyed }
                ?.let { extension.setMessageDelegate(it.markerMessageDelegate, MARKER_NATIVE_APP) }
        }

        private fun checkedMarker(extension: WebExtension?): WebExtension {
            check(extension?.id == MARKER_EXTENSION_ID && extension.metaData.version == MARKER_VERSION) {
                "Synthetic marker metadata mismatch"
            }
            return requireNotNull(extension)
        }

        private fun beginMarkerOperation(runtime: GeckoRuntime, operation: String) {
            if (sharedRuntime !== runtime || pendingMarker != null || shutdownRequested) return
            val gate = GeckoResult<WebExtension?>()
            pendingMarker = gate
            currentActivity?.takeIf { it.runtime === runtime }?.let {
                it.markerButtons.forEach { button -> button.isEnabled = false }
                it.markerExtensionState.text = "GV-MARKER-STATE-BUSY slot=${it.slot}"
                it.markerStatus.text = "GV-MARKER-WAIT slot=${it.slot}"
                it.markerPort?.setDelegate(RETIRED_MARKER_PORT_DELEGATE)
                it.markerPort = null
                it.markerReadPort = null
            }
            val controller = runtime.webExtensionController
            var expectedEnabled: Boolean? = null
            val chain = controller.list().then<WebExtension?> { extensions ->
                val exact = extensions.orEmpty().singleOrNull { it.id == MARKER_EXTENSION_ID }
                expectedEnabled = when (operation) {
                    "enable", "reinstall" -> true
                    "disable" -> exact?.let { false }
                    "discover" -> exact?.metaData?.enabled
                    else -> null
                }
                // geckoViewAddons native messaging is privileged only for this non-shipping synthetic fixture.
                when {
                    exact != null && exact.metaData.version == MARKER_VERSION && exact.metaData.enabled &&
                        operation in setOf("discover", "enable", "reinstall") -> {
                        checkedMarker(exact)
                        bindCurrentMarker(runtime, exact)
                        controller.disable(exact, WebExtensionController.EnableSource.APP).then { disabled ->
                            val stopped = checkedMarker(disabled)
                            bindCurrentMarker(runtime, stopped)
                            controller.enable(stopped, WebExtensionController.EnableSource.APP)
                                .map { checkedMarker(it).also { enabled -> check(enabled.metaData.enabled) { "Marker restart failed" } } }
                        }
                    }
                    operation == "reinstall" -> controller.ensureBuiltIn(
                        "resource://android/assets/issue6-marker/", MARKER_EXTENSION_ID,
                    ).map { checkedMarker(it).also { installed -> bindCurrentMarker(runtime, installed) } }
                    operation == "discover" && exact != null && exact.metaData.version != MARKER_VERSION ->
                        controller.installBuiltIn("resource://android/assets/issue6-marker/")
                            .map { checkedMarker(it).also { installed -> bindCurrentMarker(runtime, installed) } }
                    exact == null -> GeckoResult.fromValue(null)
                    else -> {
                        checkedMarker(exact)
                        bindCurrentMarker(runtime, exact)
                        when (operation) {
                            "disable" -> controller.disable(exact, WebExtensionController.EnableSource.APP)
                                .map { checkedMarker(it) }
                            "enable" -> controller.enable(exact, WebExtensionController.EnableSource.APP)
                                .map { checkedMarker(it).also { enabled -> check(enabled.metaData.enabled) { "Marker enable failed" } } }
                            "uninstall" -> controller.uninstall(exact).map { null }
                            "discover" -> GeckoResult.fromValue(exact)
                            else -> GeckoResult.fromException(IllegalArgumentException("Unknown marker operation"))
                        }
                    }
                }
            }.then<WebExtension?> {
                controller.list().map { extensions ->
                    val exact = extensions.orEmpty().singleOrNull { it.id == MARKER_EXTENSION_ID }?.let { checkedMarker(it) }
                    check(if (expectedEnabled == null) exact == null else exact?.metaData?.enabled == expectedEnabled) {
                        "Marker final state mismatch"
                    }
                    exact
                }
            }
            chain.accept(
                { extension ->
                    if (sharedRuntime === runtime && pendingMarker === gate) {
                        pendingMarker = null
                        currentActivity?.takeIf { it.runtime === runtime && !it.isDestroyed }?.let {
                            it.renderMarkerState(extension)
                            it.readVerifiedMarker()
                            it.markerButtons.forEach { button -> button.isEnabled = !shutdownRequested }
                        }
                    }
                    gate.complete(extension)
                },
                { error ->
                    if (sharedRuntime === runtime && pendingMarker === gate) {
                        currentActivity?.takeIf { it.runtime === runtime && !it.isDestroyed }?.let {
                            it.markerPort?.setDelegate(RETIRED_MARKER_PORT_DELEGATE)
                            it.markerPort = null
                            it.markerReadPort = null
                            it.markerExtension = null
                            it.markerExtensionState.text = "GV-MARKER-STATE-FAILED slot=${it.slot} profile=${it.profileId}"
                            it.markerButtons.forEach { button -> button.isEnabled = !shutdownRequested }
                        }
                        pendingMarker = null
                    }
                    gate.completeExceptionally(requireNotNull(error))
                },
            )
            // Observe failures even when no shutdown waiter is attached.
            gate.accept({}, {})
        }


        fun shutdownProcess() {
            if (shutdownRequested) return
            shutdownRequested = true
            val runtime = sharedRuntime
            if (runtime == null) {
                Process.killProcess(Process.myPid())
                return
            }
            val pending = pendingMarker
            if (pending != null) {
                pending.accept({ finishShutdown(runtime) }, { finishShutdown(runtime) })
            } else finishShutdown(runtime)
        }

        private fun finishShutdown(runtime: GeckoRuntime) {
            if (sharedRuntime !== runtime) return
            // Do not hard-kill before Gecko flushes profile state; the router retains its bounded stop timeout.
            runtime.delegate = object : GeckoRuntime.Delegate {
                override fun onShutdown() {
                    Process.killProcess(Process.myPid())
                }
            }
            runtime.shutdown()
        }

        const val STEAM_LISTING_URL =
            "https://steamcommunity.com/market/listings/730/AK-47%20%7C%20Redline%20%28Field-Tested%29"
        const val BLOCKED_TEST_URL = "https://example.invalid/issue-7-redacted-test"
        const val MISSING_BROWSER_PACKAGE = "com.steamaccountmanager.missing.browser"
        const val CSFLOAT_XPI_URL =
            "https://addons.mozilla.org/firefox/downloads/file/4957680/csgofloat-5.17.0.xpi"
        const val CSFLOAT_NAME = "CSFloat Market Checker"
        const val MARKER_VERSION = "1.5"
        const val ARTIFACT_METADATA =
            "GeckoView 153.0.20260810162159\n" +
                "CSFloat Market Checker 5.17.0\n" +
                "Gecko ID: {194d0dc6-7ada-41c6-88b8-95d7636fe43c}\n" +
                "Official signed XPI: $CSFLOAT_XPI_URL\n" +
                "Size: 7,011,169 bytes\n" +
                "SHA-256: 70C540B8B1DF125596EF615FE37028542DE4D92B3816AD81EB6AD5CE3D11798D\n" +
                "Signature is validated by GeckoView during install; observed signed state appears after success."
    }
}

const val PROTOTYPE_NAVIGATION_BLOCKED_MESSAGE =
    "GV-NAVIGATION-BLOCKED: Destination blocked. Stay here or open it in your external browser."
const val PROTOTYPE_EXTERNAL_HANDOFF_UNAVAILABLE_MESSAGE =
    "GV-EXTERNAL-HANDOFF-UNAVAILABLE: No external browser can open this destination. Stay here."

fun prototypeFixtureUri(slot: String, next: Boolean = false) =
    "http://127.0.0.1:$LOOPBACK_PORT/slot/$slot" + if (next) "/next" else ""

fun isPrototypeExternalHandoffEligible(rawUri: String): Boolean {
    val uri = try {
        URI(rawUri)
    } catch (_: Exception) {
        return false
    }
    return (uri.scheme.equals("http", ignoreCase = true) || uri.scheme.equals("https", ignoreCase = true)) &&
        uri.host != null && uri.userInfo == null
}

fun isPrototypeNavigationAllowed(rawUri: String, slot: String): Boolean {
    val uri = try {
        URI(rawUri)
    } catch (_: Exception) {
        return false
    }
    val fixture = URI(prototypeFixtureUri(slot))
    if (uri.scheme == fixture.scheme && uri.host == fixture.host && uri.port == fixture.port &&
        (uri.rawPath == fixture.rawPath || uri.rawPath == "${fixture.rawPath}/next") && uri.rawQuery == null && uri.userInfo == null &&
        (uri.rawFragment == null || uri.rawFragment == "$slot-history")
    ) return true
    if (!uri.scheme.equals("https", ignoreCase = true) || uri.userInfo != null) return false
    val steam = BuiltInWebsites.STEAM
    return WebsitePolicy(steam.domain, steam.allowedAuthDomains).isHostAllowed(uri.host)
}

private object PrototypeLoopbackServer {
    @Volatile private var server: ServerSocket? = null

    @Synchronized fun start(): Boolean {
        if (server != null) return true
        val bound = try {
            ServerSocket(LOOPBACK_PORT, 8, InetAddress.getByName("127.0.0.1"))
        } catch (_: Exception) {
            return false
        }
        server = bound
        Executors.newSingleThreadExecutor().execute {
            bound.use {
                while (!it.isClosed) try {
                    it.accept().use { socket ->
                        socket.soTimeout = 2_000
                        val request = BufferedReader(InputStreamReader(socket.getInputStream(), StandardCharsets.US_ASCII))
                            .readLine().orEmpty()
                        val requestedSlot = Regex("^GET /slot/([AB])(?:/next)? HTTP/1\\.[01]$")
                            .matchEntire(request)?.groupValues?.get(1)
                        val body = if (requestedSlot == null) {
                            "<!doctype html><title>GV6|error=request</title>"
                        } else {
                            page(requestedSlot)
                        }
                        val status = if (requestedSlot == null) "400 Bad Request" else "200 OK"
                        val bytes = body.toByteArray(StandardCharsets.UTF_8)
                        socket.getOutputStream().write(
                            "HTTP/1.1 $status\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n"
                                .toByteArray(StandardCharsets.US_ASCII),
                        )
                        socket.getOutputStream().write(bytes)
                    }
                } catch (_: Exception) {
                    // A bounded client failure must not terminate the fixed test server.
                }
            }
            synchronized(this) {
                if (server === bound) server = null
            }
        }
        return true
    }

    private fun page(slot: String) = """<!doctype html><meta charset=utf-8><body style="padding-top:300px"><a style="position:fixed;top:0;left:0;width:100%;height:140px" href="${prototypeFixtureUri(slot)}#$slot-history" target="_blank">Open allowed fixture window</a><a style="position:fixed;top:140px;left:0;width:100%;height:140px" href="https://example.invalid/issue-7-redacted-test" target="_blank">Open blocked fixture window</a><h1>Issue 6 synthetic slot $slot</h1><pre id=o>GV6|loading</pre><script>
const s='$slot'; if(!document.cookie.includes('gv6='))document.cookie='gv6='+s+'; SameSite=Strict';
if(!localStorage.gv6)localStorage.gv6=s;
const expected=s+'-history';if(!history.state?.gv6)history.replaceState({gv6:expected},'',location.pathname+'#'+expected);const n=history.state?.gv6||'missing';
const q=indexedDB.open('gv6',1);q.onupgradeneeded=()=>q.result.createObjectStore('m');q.onsuccess=()=>{const d=q.result.transaction('m','readwrite').objectStore('m');const g=d.get('slot');g.onsuccess=()=>{const prior=g.result||s;if(!g.result)d.put(s,'slot');const c=(document.cookie.match(/gv6=([AB])/)||[])[1]||'missing';const l=localStorage.gv6||'missing';const text=`GV6|slot=${'$'}{s}|cookie=${'$'}{c}|local=${'$'}{l}|idb=${'$'}{prior}|nav=${'$'}{n}`;document.title=text;document.getElementById('o').textContent=text;};};
</script></body>"""
}

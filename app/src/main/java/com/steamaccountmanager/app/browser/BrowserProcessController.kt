package com.steamaccountmanager.app.browser

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.util.Log
import com.steamaccountmanager.app.BrowserActivity
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * Opens one [SessionIdentifier] (account + website pair) with an isolated,
 * persistent engine-owned browser profile in the dedicated `:browser` process.
 *
 * Every session uses a deterministic GeckoView profile. Switching profile identity
 * restarts the worker; reopening the same
 * identity reuses it. By construction, only one browser session is live in memory,
 * while inactive profile state remains on disk under GeckoView.
 */
object BrowserProcessController {

    const val ACTION_SHUTDOWN_BROWSER_PROCESS = "com.steamaccountmanager.app.action.SHUTDOWN_BROWSER_PROCESS"

    private const val ROUTER_PREFS = "browser_router_prefs"
    private const val KEY_ACTIVE_SESSION = "active_session"
    private const val KEY_ROUTING_TOKEN = "routing_token"
    private const val SHUTDOWN_POLL_INTERVAL_MS = 100L
    private const val SHUTDOWN_TIMEOUT_MS = 8_000L
    private const val GRACEFUL_SHUTDOWN_MS = 3_000L
    private const val LAUNCH_CONFIRMATION_TIMEOUT_MS = 8_000L
    private val routingMutex = Mutex()

    /**
     * Opens [sessionId] at [targetUrl], restricted to [allowedDomains]. Suspends
     * briefly on a background dispatcher only when a *different* session is
     * currently loaded and the browser process must be restarted first.
     */
    suspend fun openWebsite(
        context: Context,
        sessionId: SessionIdentifier,
        targetUrl: String,
        allowedDomains: List<String>,
    ) = routingMutex.withLock {
        val appContext = context.applicationContext
        val requestedSession = isolationIdentity(sessionId)
        var routingToken = UUID.randomUUID().toString()

        val authorized = withContext(Dispatchers.IO) {
            val prefs = appContext.getSharedPreferences(ROUTER_PREFS, Context.MODE_PRIVATE)
            val activeSession = prefs.getString(KEY_ACTIVE_SESSION, null)
            val processes = browserProcesses(appContext)
            val exactWorkerRunning = processes.any { it.processName == browserWorkerName(appContext) }
            val cleanupSucceeded = when {
                exactWorkerRunning && activeSession != requestedSession ->
                    requestShutdownAndAwaitDeath(appContext, processes)
                !exactWorkerRunning && processes.isNotEmpty() ->
                    terminateCapturedChildrenAndAwaitDeath(appContext, processes)
                else -> true
            }
            if (!cleanupSucceeded) {
                Log.e(TAG, "Browser session switch timed out; refusing to launch the requested profile.")
                return@withContext false
            }
            if (exactWorkerRunning && activeSession == requestedSession) {
                routingToken = prefs.getString(KEY_ROUTING_TOKEN, null) ?: routingToken
            }

            prefs.edit()
                .putString(KEY_ACTIVE_SESSION, requestedSession)
                .putString(KEY_ROUTING_TOKEN, routingToken)
                .commit()
        }
        if (!authorized) return@withLock

        val intent = Intent(appContext, BrowserActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(EXTRA_ACCOUNT_ID, sessionId.accountId)
            putExtra(EXTRA_WEBSITE_ID, sessionId.websiteId)
            putExtra(EXTRA_START_URL, targetUrl)
            putExtra(EXTRA_ROUTING_TOKEN, routingToken)
            putStringArrayListExtra(EXTRA_ALLOWED_DOMAINS, ArrayList(allowedDomains))
        }
        try {
            appContext.startActivity(intent)
        } catch (error: Exception) {
            clearLaunchAuthorization(appContext, routingToken)
            Log.e(TAG, "Browser worker launch failed; routing authorization was cleared.", error)
            return@withLock
        }

        val workerAppeared = withContext(Dispatchers.IO) { awaitBrowserWorker(appContext) }
        if (!workerAppeared) {
            clearLaunchAuthorization(appContext, routingToken)
            Log.e(TAG, "Browser worker launch was not observed; routing authorization was cleared.")
            withContext(Dispatchers.IO) {
                val processes = browserProcesses(appContext)
                if (processes.any { it.processName == browserWorkerName(appContext) }) {
                    requestShutdownAndAwaitDeath(appContext, processes)
                } else if (processes.isNotEmpty()) {
                    terminateCapturedChildrenAndAwaitDeath(appContext, processes)
                }
            }
        }
    }

    /** Browser-process startup guard against a delayed launch whose router authorization expired. */
    fun isLaunchAuthorized(context: Context, sessionId: SessionIdentifier, routingToken: String?): Boolean {
        if (routingToken == null) return false
        val prefs = context.getSharedPreferences(ROUTER_PREFS, Context.MODE_PRIVATE)
        return prefs.getString(KEY_ACTIVE_SESSION, null) == isolationIdentity(sessionId) &&
            prefs.getString(KEY_ROUTING_TOKEN, null) == routingToken
    }

    /** Whether the currently-loaded browser session (if any) is this one. */
    fun isSessionCurrentlyActive(context: Context, sessionId: SessionIdentifier): Boolean {
        val prefs = context.getSharedPreferences(ROUTER_PREFS, Context.MODE_PRIVATE)
        return browserProcesses(context).any { it.processName == browserWorkerName(context) } &&
            prefs.getString(KEY_ACTIVE_SESSION, null) == isolationIdentity(sessionId)
    }

    /** Stops the production browser generation and its Gecko children under the routing lock. */
    suspend fun stopBrowser(context: Context): Boolean = routingMutex.withLock {
        val appContext = context.applicationContext
        val stopped = withContext(Dispatchers.IO) {
            val processes = browserProcesses(appContext)
            when {
                processes.any { it.processName == browserWorkerName(appContext) } ->
                    requestShutdownAndAwaitDeath(appContext, processes)
                processes.isNotEmpty() -> terminateCapturedChildrenAndAwaitDeath(appContext, processes)
                else -> revokeLaunchAuthorization(appContext)
            }
        }
        if (stopped) {
            appContext.getSharedPreferences(ROUTER_PREFS, Context.MODE_PRIVATE).edit()
                .remove(KEY_ACTIVE_SESSION)
                .remove(KEY_ROUTING_TOKEN)
                .commit()
        }
        stopped
    }

    internal fun isOwnedBrowserProcessName(packageName: String, processName: String): Boolean {
        if (processName == "$packageName$BROWSER_PROCESS_SUFFIX") return true
        val suffix = processName.removePrefix(packageName).takeIf { processName.startsWith(packageName) } ?: return false
        if (suffix == ":media") return true
        if (suffix in FIXED_GECKO_PROCESS_SUFFIXES) return true
        val indexed = GECKO_INDEXED_PROCESS.matchEntire(suffix) ?: return false
        return indexed.groupValues[2].toIntOrNull() in 0..39
    }

    private fun browserProcesses(context: Context): List<ActivityManager.RunningAppProcessInfo> {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return am.runningAppProcesses.orEmpty().filter {
            isOwnedBrowserProcessName(context.packageName, it.processName)
        }
    }

    private fun requestShutdownAndAwaitDeath(
        context: Context,
        oldGeneration: List<ActivityManager.RunningAppProcessInfo>,
    ): Boolean {
        val oldWorker = oldGeneration.singleOrNull { it.processName == browserWorkerName(context) } ?: return false
        // Android may recreate a killed foreground activity. Its old token must already be invalid.
        if (!revokeLaunchAuthorization(context)) return false
        context.sendBroadcast(
            Intent(context, BrowserShutdownReceiver::class.java).setAction(ACTION_SHUTDOWN_BROWSER_PROCESS),
        )
        val startedAt = System.currentTimeMillis()
        val deadline = startedAt + SHUTDOWN_TIMEOUT_MS
        val forceWorkerAfter = startedAt + GRACEFUL_SHUTDOWN_MS
        var workerFallbackLogged = false
        var stableEmptyPolls = 0
        while (System.currentTimeMillis() < deadline) {
            val processes = browserProcesses(context)
            val oldWorkerGone = processes.none { it.pid == oldWorker.pid && it.processName == oldWorker.processName }
            if (!oldWorkerGone && System.currentTimeMillis() >= forceWorkerAfter) {
                val confirmedProcesses = browserProcesses(context)
                val stillCapturedWorker = confirmedProcesses.any {
                    it.pid == oldWorker.pid && it.processName == oldWorker.processName
                }
                if (stillCapturedWorker) {
                    Process.killProcess(oldWorker.pid)
                    if (!workerFallbackLogged) {
                        Log.w(TAG, "Graceful browser shutdown exceeded its grace period; applying bounded fallback.")
                        workerFallbackLogged = true
                    }
                }
                terminateObservedChildren(
                    context,
                    confirmedProcesses.filterNot { it.processName == browserWorkerName(context) },
                )
            }
            if (oldWorkerGone) {
                terminateObservedChildren(context, processes.filterNot { it.processName == browserWorkerName(context) })
                if (processes.isEmpty()) {
                    stableEmptyPolls++
                    if (stableEmptyPolls >= STABLE_DEATH_POLLS) return true
                } else {
                    stableEmptyPolls = 0
                }
            }
            Thread.sleep(SHUTDOWN_POLL_INTERVAL_MS)
        }
        return false
    }

    private fun terminateCapturedChildrenAndAwaitDeath(
        context: Context,
        oldGeneration: List<ActivityManager.RunningAppProcessInfo>,
    ): Boolean {
        if (!revokeLaunchAuthorization(context)) return false
        val deadline = System.currentTimeMillis() + SHUTDOWN_TIMEOUT_MS
        var stableEmptyPolls = 0
        while (System.currentTimeMillis() < deadline) {
            val processes = browserProcesses(context)
            terminateObservedChildren(context, processes)
            val oldGenerationGone = oldGeneration.none { old ->
                processes.any { it.pid == old.pid && it.processName == old.processName }
            }
            if (oldGenerationGone && processes.isEmpty()) {
                stableEmptyPolls++
                if (stableEmptyPolls >= STABLE_DEATH_POLLS) return true
            } else {
                stableEmptyPolls = 0
            }
            Thread.sleep(SHUTDOWN_POLL_INTERVAL_MS)
        }
        return false
    }

    private fun terminateObservedChildren(
        context: Context,
        observed: List<ActivityManager.RunningAppProcessInfo>,
    ) {
        val observedByPid = observed.associate { it.pid to it.processName }
        browserProcesses(context)
            .filter { observedByPid[it.pid] == it.processName && it.processName != browserWorkerName(context) }
            .forEach { Process.killProcess(it.pid) }
    }

    private fun awaitBrowserWorker(context: Context): Boolean {
        val deadline = System.currentTimeMillis() + LAUNCH_CONFIRMATION_TIMEOUT_MS
        val workerName = browserWorkerName(context)
        while (System.currentTimeMillis() < deadline) {
            if (browserProcesses(context).any { it.processName == workerName }) return true
            Thread.sleep(SHUTDOWN_POLL_INTERVAL_MS)
        }
        return browserProcesses(context).any { it.processName == workerName }
    }

    private fun revokeLaunchAuthorization(context: Context): Boolean =
        context.getSharedPreferences(ROUTER_PREFS, Context.MODE_PRIVATE).edit()
            .remove(KEY_ACTIVE_SESSION)
            .remove(KEY_ROUTING_TOKEN)
            .commit()

    private fun clearLaunchAuthorization(context: Context, routingToken: String) {
        val prefs = context.getSharedPreferences(ROUTER_PREFS, Context.MODE_PRIVATE)
        if (prefs.getString(KEY_ROUTING_TOKEN, null) == routingToken) {
            prefs.edit().remove(KEY_ACTIVE_SESSION).remove(KEY_ROUTING_TOKEN).commit()
        }
    }

    private fun isolationIdentity(sessionId: SessionIdentifier) = GeckoProfileIdentity.idFor(sessionId)

    private fun browserWorkerName(context: Context) = context.packageName + BROWSER_PROCESS_SUFFIX

    private const val TAG = "BrowserProcessController"
    private const val STABLE_DEATH_POLLS = 3
    private const val BROWSER_PROCESS_SUFFIX = ":browser"
    private val FIXED_GECKO_PROCESS_SUFFIXES = setOf(
        ":crashhelper_disable_art_image_",
        ":gmplugin_disable_art_image_",
        ":socket_disable_art_image_",
        ":gpu_disable_art_image_",
        ":rdd_disable_art_image_",
        ":utility_disable_art_image_",
        ":ipdlunittest_disable_art_image_",
        ":zygoteTab_disable_art_image_",
    )
    private val GECKO_INDEXED_PROCESS = Regex("^:(isolatedTab|tab)_disable_art_image_([0-9]|[1-3][0-9])$")
    const val EXTRA_ACCOUNT_ID = "extra_account_id"
    const val EXTRA_WEBSITE_ID = "extra_website_id"
    const val EXTRA_START_URL = "extra_start_url"
    const val EXTRA_ROUTING_TOKEN = "extra_routing_token"
    const val EXTRA_ALLOWED_DOMAINS = "extra_allowed_domains"
}

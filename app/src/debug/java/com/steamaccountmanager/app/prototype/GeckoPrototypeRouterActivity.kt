package com.steamaccountmanager.app.prototype

import android.app.ActivityManager
import android.content.Context
import android.content.BroadcastReceiver
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import java.io.File

internal const val EXTRA_SLOT = "prototype_slot"
internal const val ACTION_SHUTDOWN = "com.steamaccountmanager.app.debug.PROTOTYPE_SHUTDOWN"
internal const val EXTRA_GENERATION = "prototype_generation"
internal const val LOOPBACK_PORT = 38947
internal const val MARKER_EXTENSION_ID = "issue6-marker@steam-account-manager.invalid"
internal const val MARKER_NATIVE_APP = "issue6Marker"

internal fun slotProfileId(slot: String): String = when (slot) {
    "A" -> geckoProfileId(SessionIdentifier("synthetic-account-a", "synthetic-website"))
    "B" -> geckoProfileId(SessionIdentifier("synthetic-account-b", "synthetic-website"))
    else -> error("GV-PROFILE-SLOT-INVALID")
}

class GeckoPrototypeRouterActivity : ComponentActivity() {
    private lateinit var status: TextView
    private lateinit var switches: ProfileSwitchCoordinator
    private var selectedSlot: String? = null
    private var destroyed = false
    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        selectedSlot = getPreferences(MODE_PRIVATE).getString("slot", null)
        switches = ProfileSwitchCoordinator(selectedSlot?.let(::slotProfileId))
        status = TextView(this).apply { setPadding(24, 24, 24, 24) }
        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(status)
            addView(button("Open synthetic slot A") { select("A") })
            addView(button("Open synthetic slot B") { select("B") })
            addView(button("Reopen selected slot") { selectedSlot?.let(::select) })
            addView(button("Recreate router activity") { recreate() })
            addView(button("Stop worker process") {
                val request = switches.stop()
                stopWorker(
                    "GV-WORKER-STOP-WAIT",
                    "GV-WORKER-STOP-TIMEOUT",
                    request.generation,
                    { switches.isPending(request.generation, null) },
                ) { stoppedGeneration ->
                    if (switches.processDeathObserved(stoppedGeneration, null)) {
                        render("GV-WORKER-STOPPED generation=$stoppedGeneration")
                    }
                }
            })
        })
        render("GV-ROUTER-READY")
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        setOnClickListener { action() }
    }

    private fun select(slot: String) {
        val profileId = slotProfileId(slot)
        var request = switches.request(profileId)
        if (processCleanupPending && !request.requiresProcessRestart) {
            switches.stop()
            request = switches.request(profileId)
        }
        if (!request.requiresProcessRestart) {
            authorize(slot)
            return
        }
        if (!processCleanupPending && !workerRunning()) {
            if (switches.processDeathObserved(request.generation, profileId)) authorize(slot)
            return
        }
        stopWorker(
            "GV-PROFILE-SWITCH-WAIT",
            "GV-PROFILE-SWITCH-TIMEOUT",
            request.generation,
            { switches.isPending(request.generation, profileId) },
        ) { stoppedGeneration ->
            if (switches.processDeathObserved(stoppedGeneration, profileId)) authorize(slot)
        }
    }

    private fun stopWorker(
        waitCode: String,
        timeoutCode: String,
        requestedGeneration: Long,
        isCurrent: () -> Boolean,
        stopped: (Long) -> Unit,
    ) {
        val cleanupAlreadyPending = processCleanupPending
        if (!cleanupAlreadyPending) {
            processCleanupPending = true
            cleanupId++
            val cleanupStartedAt = System.currentTimeMillis()
            cleanupDeadline = cleanupStartedAt + 8_000
            cleanupForceWorkerAfter = cleanupStartedAt + 6_000
            val workerName = "$packageName:gecko_prototype"
            val capturedWorker = appChildProcesses().singleOrNull { it.processName == workerName }
            cleanupWorkerPid = capturedWorker?.pid
            cleanupWorkerName = capturedWorker?.processName
            cleanupProcesses = emptyMap()
            cleanupSnapshotTaken = false
            cleanupWorkerMissingPolls = 0
        }
        val requestedCleanupId = cleanupId
        render("$waitCode generation=$requestedGeneration")
        if (!cleanupAlreadyPending) {
            sendBroadcast(Intent(this, PrototypeWorkerShutdownReceiver::class.java).setAction(ACTION_SHUTDOWN).apply {
                putExtra(EXTRA_GENERATION, requestedGeneration)
            })
        }
        var emptyPolls = 0
        fun poll() {
            val canComplete = !destroyed && isCurrent()
            if (!canComplete && !destroyed) return
            if (requestedCleanupId != cleanupId) return
            if (!processCleanupPending) {
                if (cleanupSucceeded && canComplete) stopped(requestedGeneration)
                else if (canComplete && switches.timedOut(requestedGeneration)) {
                    render("$timeoutCode generation=$requestedGeneration")
                }
                return
            }
            val runningProcesses = appChildProcesses()
            if (System.currentTimeMillis() >= cleanupForceWorkerAfter) {
                val capturedPid = cleanupWorkerPid
                val capturedName = cleanupWorkerName
                if (capturedPid != null && capturedName != null && appChildProcesses().any {
                        it.pid == capturedPid && it.processName == capturedName
                    }
                ) {
                    Process.killProcess(capturedPid)
                }
            }
            if (!cleanupSnapshotTaken && runningProcesses.none { it.processName == "$packageName:gecko_prototype" }) {
                cleanupWorkerMissingPolls++
                if (cleanupWorkerMissingPolls >= 3) {
                    cleanupProcesses = runningProcesses.associate { it.pid to it.processName }
                    cleanupSnapshotTaken = true
                }
            } else if (!cleanupSnapshotTaken) cleanupWorkerMissingPolls = 0
            if (!cleanupSnapshotTaken) {
                if (System.currentTimeMillis() >= cleanupDeadline) {
                    finishCleanup(requestedCleanupId, false)
                    if (canComplete && switches.timedOut(requestedGeneration)) {
                        render("$timeoutCode generation=$requestedGeneration")
                    }
                } else handler.postDelayed(::poll, 200)
                return
            }
            terminateOwnedChildProcesses(runningProcesses)
            val cleanupComplete = runningProcesses.isEmpty() && cleanupProcesses.keys.none { pid ->
                File("/proc/$pid").exists()
            }
            if (cleanupComplete) {
                emptyPolls++
                if (emptyPolls < 3) handler.postDelayed(::poll, 200)
                else {
                    finishCleanup(requestedCleanupId, true)
                    if (canComplete) stopped(requestedGeneration)
                }
            } else if (System.currentTimeMillis() >= cleanupDeadline) {
                finishCleanup(requestedCleanupId, false)
                if (canComplete && switches.timedOut(requestedGeneration)) {
                    render("$timeoutCode generation=$requestedGeneration")
                }
            } else {
                emptyPolls = 0
                handler.postDelayed(::poll, 200)
            }
        }
        handler.postDelayed(::poll, 200)
    }

    override fun onDestroy() {
        destroyed = true
        switches.invalidate()
        super.onDestroy()
    }

    private fun authorize(slot: String) {
        selectedSlot = slot
        getPreferences(MODE_PRIVATE).edit()
            .putString("slot", slot)
            .putString("profile", slotProfileId(slot))
            .apply()
        render("GV-PROFILE-AUTHORIZED slot=$slot profile=${slotProfileId(slot)}")
        startActivity(Intent(this, GeckoViewPrototypeActivity::class.java).putExtra(EXTRA_SLOT, slot))
    }

    private fun workerRunning(): Boolean {
        return appChildProcesses().isNotEmpty()
    }

    private fun appChildProcesses(): List<ActivityManager.RunningAppProcessInfo> {
        val prefix = "$packageName:"
        return (getSystemService(ACTIVITY_SERVICE) as ActivityManager).runningAppProcesses.orEmpty()
            .filter { it.processName.startsWith(prefix) }
    }

    private fun terminateOwnedChildProcesses(processes: List<ActivityManager.RunningAppProcessInfo>) {
        val worker = "${packageName}:gecko_prototype"
        processes
            .filter { process ->
                process.processName != worker && cleanupProcesses[process.pid] == process.processName
            }
            .forEach { Process.killProcess(it.pid) }
    }

    private fun finishCleanup(requestedCleanupId: Long, succeeded: Boolean) {
        if (processCleanupPending && cleanupId == requestedCleanupId) {
            processCleanupPending = false
            cleanupSucceeded = succeeded
            cleanupProcesses = emptyMap()
            cleanupSnapshotTaken = false
            cleanupWorkerMissingPolls = 0
            cleanupWorkerPid = null
            cleanupWorkerName = null
            cleanupForceWorkerAfter = 0L
        }
    }

    private fun render(code: String) {
        status.text = "$code\nselected=${selectedSlot ?: "none"}\nrouterPid=${android.os.Process.myPid()}"
    }

    companion object {
        @Volatile private var processCleanupPending = false
        private var cleanupId = 0L
        private var cleanupDeadline = 0L
        private var cleanupSucceeded = false
        private var cleanupProcesses = emptyMap<Int, String>()
        private var cleanupSnapshotTaken = false
        private var cleanupWorkerMissingPolls = 0
        private var cleanupWorkerPid: Int? = null
        private var cleanupWorkerName: String? = null
        private var cleanupForceWorkerAfter = 0L
    }
}

class PrototypeWorkerShutdownReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_SHUTDOWN) GeckoViewPrototypeActivity.shutdownProcess()
    }
}

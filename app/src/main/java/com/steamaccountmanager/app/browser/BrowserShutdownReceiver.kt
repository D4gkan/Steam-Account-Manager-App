package com.steamaccountmanager.app.browser

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.steamaccountmanager.app.BrowserActivity

/**
 * Registered in the manifest with `android:process=":browser"`, so it always runs
 * INSIDE the browser process regardless of which component sent the broadcast.
 * On receipt, it asks the active engine to flush and shut down before process death. The next time
 * [BrowserProcessController.openWebsite] starts [com.steamaccountmanager.app.BrowserActivity],
 * Android spins up a brand-new `:browser` process, which is then free to call
 * the next isolated Gecko profile is authorized.
 */
class BrowserShutdownReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == BrowserProcessController.ACTION_SHUTDOWN_BROWSER_PROCESS) {
            BrowserActivity.shutdownBrowserProcess()
        }
    }
}

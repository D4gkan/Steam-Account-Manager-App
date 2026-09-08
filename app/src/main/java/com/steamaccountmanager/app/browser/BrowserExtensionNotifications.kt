package com.steamaccountmanager.app.browser

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.steamaccountmanager.app.MainActivity
import com.steamaccountmanager.app.R
import org.mozilla.geckoview.WebNotification
import org.mozilla.geckoview.WebNotificationDelegate

/** One private, generic alert for the active profile; never copy trade contents to Android. */
class BrowserExtensionNotifications(private val context: Context, private val name: String) : WebNotificationDelegate {
    private val manager = context.getSystemService(NotificationManager::class.java)
    private val main = Handler(Looper.getMainLooper())
    private var shown: WebNotification? = null
    private var closed = false

    init {
        manager.cancel(NOTIFICATION_ID)
        current = this
        manager.createNotificationChannel(NotificationChannel(CHANNEL, "Marketplace updates", NotificationManager.IMPORTANCE_DEFAULT))
    }

    override fun onShowNotification(notification: WebNotification) {
        main.post {
            if (closed || !manager.areNotificationsEnabled() || (Build.VERSION.SDK_INT >= 33 &&
                    context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)) {
                notification.dismiss()
                return@post
            }
            clear()
            val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE)
            val dismissed = PendingIntent.getBroadcast(context, 0,
                Intent(context, BrowserNotificationDismissReceiver::class.java), PendingIntent.FLAG_IMMUTABLE)
            // ponytail: coalesce alerts for one active profile; add a private inbox only if needed.
            val alert = Notification.Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("$name update")
                .setContentText("Open this website in the app to check its latest status.")
                .setVisibility(Notification.VISIBILITY_PRIVATE)
                .setContentIntent(open).setDeleteIntent(dismissed).setAutoCancel(true).build()
            try {
                manager.notify(NOTIFICATION_ID, alert)
                shown = notification
                notification.show()
            } catch (_: SecurityException) {
                notification.dismiss()
            }
        }
    }

    override fun onCloseNotification(notification: WebNotification) {
        main.post { if (shown?.tag == notification.tag) clear() }
    }

    fun clear() {
        val previous = shown
        shown = null
        manager.cancel(NOTIFICATION_ID)
        previous?.dismiss()
    }

    fun close() {
        closed = true
        clear()
        if (current === this) current = null
    }

    companion object {
        internal const val NOTIFICATION_ID = 730
        private const val CHANNEL = "marketplace-updates"
        internal var current: BrowserExtensionNotifications? = null
    }
}

class BrowserNotificationDismissReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        BrowserExtensionNotifications.current?.clear()
    }
}

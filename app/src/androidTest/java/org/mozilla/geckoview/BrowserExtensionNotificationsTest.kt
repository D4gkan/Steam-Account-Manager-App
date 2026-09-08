package org.mozilla.geckoview

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.os.Build
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.browser.BrowserExtensionNotifications
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BrowserExtensionNotificationsTest {
    // The package-private Gecko constructor supplies synthetic input at the real delegate boundary.
    private class SyntheticNotification : WebNotification(
        "SYNTHETIC_PRIVATE_TRADE", "synthetic", "", "SYNTHETIC_PRIVATE_TRADE", "", "auto", "en",
        false, "", false, false, intArrayOf(), emptyArray<Any>(), "https://example.invalid",
    ) {
        var shown = 0
        var dismissed = 0
        override fun show() { shown++ }
        override fun dismiss() { dismissed++ }
    }

    @Test
    fun nativeAlertIsPrivateCoalescedAndCannotOutliveTheProfile() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val context = instrumentation.targetContext.applicationContext
        if (Build.VERSION.SDK_INT >= 33) {
            instrumentation.uiAutomation.grantRuntimePermission(context.packageName, Manifest.permission.POST_NOTIFICATIONS)
        }
        val manager = context.getSystemService(NotificationManager::class.java)
        lateinit var delegate: BrowserExtensionNotifications
        val first = SyntheticNotification()
        val second = SyntheticNotification()
        val afterClose = SyntheticNotification()
        try {
            instrumentation.runOnMainSync {
                delegate = BrowserExtensionNotifications(context, "CS.MONEY")
                delegate.onShowNotification(first)
            }
            instrumentation.waitForIdleSync()
            val alert = manager.activeNotifications.single { it.id == BrowserExtensionNotifications.NOTIFICATION_ID }.notification
            assertEquals("CS.MONEY update", alert.extras.getString(Notification.EXTRA_TITLE))
            assertFalse(alert.extras.getString(Notification.EXTRA_TEXT).orEmpty().contains("SYNTHETIC_PRIVATE"))
            assertEquals(Notification.VISIBILITY_PRIVATE, alert.visibility)
            assertEquals(1, first.shown)
            instrumentation.runOnMainSync { delegate.onShowNotification(second) }
            instrumentation.waitForIdleSync()
            assertEquals(1, first.dismissed)
            assertEquals(1, second.shown)
            instrumentation.runOnMainSync {
                delegate.onShowNotification(afterClose)
                delegate.close()
            }
            instrumentation.waitForIdleSync()
            assertEquals(1, second.dismissed)
            assertEquals(0, afterClose.shown)
            assertEquals(1, afterClose.dismissed)
            assertTrue(manager.activeNotifications.none { it.id == BrowserExtensionNotifications.NOTIFICATION_ID })
        } finally {
            instrumentation.runOnMainSync { delegate.close() }
        }
    }
}

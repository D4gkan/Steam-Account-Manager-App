package com.steamaccountmanager.app

import android.graphics.Rect
import android.os.Bundle
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.domain.model.Account
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

@RunWith(AndroidJUnit4::class)
class AccountManagementTest {
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val automation get() = instrumentation.uiAutomation
    private val repository get() = (instrumentation.targetContext.applicationContext as SteamAccountManagerApp).accountRepository

    @Test fun draggingNearBottomScrollsThroughLongAccountList() = runBlocking {
        val accounts = (0..15).map { repository.createAccount("Drag account $it") }
        try {
            ActivityScenario.launch(MainActivity::class.java).use {
                val from = bounds("Edit ${accounts.first().displayName}")
                val display = instrumentation.targetContext.resources.displayMetrics
                drag(48f * display.density, from.exactCenterY(), display.heightPixels - 120f * display.density, 2_000)
                waitFor { order(accounts).indexOf(accounts.first().id) >= 6 }
            }
        } finally {
            accounts.forEach { repository.deleteAccount(it) }
        }
    }

    @Test fun editDeleteAndLongPressReorderPersist() = runBlocking {
        val token = UUID.randomUUID().toString().take(4)
        val a = repository.createAccount("Alpha $token")
        val b = repository.createAccount("Beta $token")
        val c = repository.createAccount("Gamma $token")
        val created = listOf(a, b, c)
        try {
            ActivityScenario.launch(MainActivity::class.java).use { scenario ->
                click("Edit ${a.displayName}")
                waitFor { find { it.className == "android.widget.EditText" } != null }
                val input = requireNotNull(find { it.className == "android.widget.EditText" })
                assertTrue(input.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, Bundle().apply {
                    putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, "  Renamed $token  ")
                }))
                click("Save")
                waitFor { runBlocking { repository.getAccount(a.id)?.displayName == "Renamed $token" } }
                waitFor { has("Edit Renamed $token") }

                // Hold the card's avatar area, away from either action button, and move it below C.
                val from = bounds("Edit Renamed $token")
                val to = bounds("Edit ${c.displayName}")
                val x = instrumentation.targetContext.resources.displayMetrics.density * 48f
                drag(x, from.exactCenterY(), to.exactCenterY() + to.height() / 2f)
                val expected = listOf(b.id, c.id, a.id)
                try {
                    waitFor { order(created) == expected }
                } catch (failure: AssertionError) {
                    throw AssertionError("Drag order: ${order(created).map { id -> created.indexOfFirst { it.id == id } }}; from=$from to=$to x=$x", failure)
                }
                scenario.recreate()
                waitFor { has("Edit Renamed $token") }
                assertEquals(expected, order(created))
                assertTrue(bounds("Edit ${b.displayName}").top < bounds("Edit ${c.displayName}").top)
                assertTrue(bounds("Edit ${c.displayName}").top < bounds("Edit Renamed $token").top)

                click("Delete ${b.displayName}")
                click("Cancel")
                assertNotNull(repository.getAccount(b.id))
                click("Delete ${b.displayName}")
                click("Delete")
                waitFor { runBlocking { repository.getAccount(b.id) == null } }
                scenario.recreate()
                waitFor { has("Edit Renamed $token") }
                assertFalse(has("Edit ${b.displayName}"))
                assertNotNull(repository.getAccount(c.id))
                assertEquals(listOf(c.id, a.id), order(created))
            }
        } finally {
            created.forEach { repository.deleteAccount(it) }
        }
    }

    private fun order(accounts: List<Account>) = runBlocking {
        repository.observeAccounts().first().filter { row -> accounts.any { it.id == row.id } }.map { it.id }
    }

    private fun drag(x: Float, fromY: Float, toY: Float, holdAtEnd: Long = 0) {
        val down = SystemClock.uptimeMillis()
        fun send(action: Int, y: Float) {
            val event = MotionEvent.obtain(down, SystemClock.uptimeMillis(), action, 1,
                arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
                arrayOf(MotionEvent.PointerCoords().apply { this.x = x; this.y = y; pressure = 1f; size = 1f }),
                0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0)
            assertTrue(automation.injectInputEvent(event, true))
            event.recycle()
        }
        send(MotionEvent.ACTION_DOWN, fromY)
        SystemClock.sleep(750)
        for (step in 1..24) {
            send(MotionEvent.ACTION_MOVE, fromY + (toY - fromY) * step / 24)
            SystemClock.sleep(35)
        }
        SystemClock.sleep(holdAtEnd)
        send(MotionEvent.ACTION_UP, toY)
    }

    private fun bounds(label: String): Rect {
        waitFor { has(label) }
        return Rect().also { requireNotNull(node(label)).getBoundsInScreen(it) }
    }

    private fun has(label: String) = node(label) != null
    private fun node(label: String) = find { it.text?.toString() == label || it.contentDescription?.toString() == label }
    private fun find(predicate: (AccessibilityNodeInfo) -> Boolean): AccessibilityNodeInfo? {
        fun visit(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
            if (node == null) return null
            if (predicate(node)) return node
            for (index in 0 until node.childCount) visit(node.getChild(index))?.let { return it }
            return null
        }
        return visit(automation.rootInActiveWindow)
    }

    private fun click(label: String) {
        waitFor {
            var current = node(label)
            var clicked = false
            while (current != null && !clicked) {
                clicked = current.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                current = current.parent
            }
            clicked
        }
    }

    private fun waitFor(condition: () -> Boolean) {
        val deadline = SystemClock.uptimeMillis() + 15_000
        while (SystemClock.uptimeMillis() < deadline) {
            if (condition()) return
            SystemClock.sleep(100)
        }
        assertTrue("Account management did not reach the expected state", condition())
    }
}

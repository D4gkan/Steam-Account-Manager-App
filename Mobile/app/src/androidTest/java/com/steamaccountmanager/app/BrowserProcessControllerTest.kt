package com.steamaccountmanager.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.browser.BrowserProcessController
import com.steamaccountmanager.app.domain.model.SessionIdentifier
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Exercises the parts of [BrowserProcessController] that don't require actually
 * spawning/killing the `:browser` process (that full round trip -- launching
 * BrowserActivity, logging into three different Steam accounts, and confirming
 * none of their cookies collide -- is the Section 38 acceptance test, and is
 * inherently a manual/UI-level test best run on a real device per the checklist
 * in README.md "Manual acceptance testing" section, since it involves real
 * network logins to Steam that shouldn't run in CI).
 *
 * What IS verified here automatically: with no browser process running, no
 * session is ever reported as "currently active" -- i.e. the router never
 * claims a stale/false-positive match, which would be the dangerous failure
 * mode (showing session A's UI state while session B's data directory is
 * actually loaded).
 */
@RunWith(AndroidJUnit4::class)
class BrowserProcessControllerTest {

    @Test
    fun noSessionIsReportedActive_whenBrowserProcessIsNotRunning() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val ow = SessionIdentifier("ow", "steam")
        val crane = SessionIdentifier("crane", "steam")

        // In a fresh test process, :browser is not running.
        assertFalse(BrowserProcessController.isSessionCurrentlyActive(context, ow))
        assertFalse(BrowserProcessController.isSessionCurrentlyActive(context, crane))
    }
}

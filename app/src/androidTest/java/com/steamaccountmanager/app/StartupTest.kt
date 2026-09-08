package com.steamaccountmanager.app

import android.content.Intent
import android.content.pm.PackageManager
import android.view.ViewTreeObserver
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.domain.model.Account
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class StartupTest {
    private val createdAccounts = mutableListOf<Account>()
    private val instrumentation get() = InstrumentationRegistry.getInstrumentation()
    private val app get() = instrumentation.targetContext.applicationContext as SteamAccountManagerApp

    @After fun removeTestAccounts() = runBlocking {
        createdAccounts.forEach { app.accountRepository.deleteAccount(it) }
    }

    @Test fun savedAccountsSurviveHomeScreenRecreation() {
        runBlocking {
            createdAccounts += app.accountRepository.createAccount("Startup regression A")
            createdAccounts += app.accountRepository.createAccount("Startup regression B")
        }
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            awaitRenderedHome(scenario)
            scenario.recreate()
            awaitRenderedHome(scenario)
        }
    }

    private fun awaitRenderedHome(scenario: ActivityScenario<MainActivity>) {
        val rendered = CountDownLatch(1)
        scenario.onActivity { activity ->
            val view = activity.window.decorView
            val listener = object : ViewTreeObserver.OnDrawListener {
                override fun onDraw() {
                    // Let repository emissions and the populated lazy list complete rendering.
                    view.postDelayed({ rendered.countDown() }, 1_000)
                }
            }
            view.viewTreeObserver.addOnDrawListener(listener)
            view.invalidate()
        }
        assertTrue("Home must render without crashing", rendered.await(10, TimeUnit.SECONDS))
        instrumentation.waitForIdleSync()
        assertEquals(Lifecycle.State.RESUMED, scenario.state)
    }

    @Test fun onlyMainActivityAppearsInLauncher() {
        val context = instrumentation.targetContext
        val intent = Intent(Intent.ACTION_MAIN)
            .addCategory(Intent.CATEGORY_LAUNCHER).setPackage(context.packageName)
        val activities = context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_ALL)
        assertEquals(listOf(MainActivity::class.java.name), activities.map { it.activityInfo.name })
    }
}

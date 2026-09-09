package com.steamaccountmanager.app.browser

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BrowserProcessNameTest {

    private val packageName = "com.steamaccountmanager.app.debug"

    @Test
    fun `accepts only production browser and merged Gecko process names`() {
        val fixedSuffixes = listOf(
            ":browser",
            ":media",
            ":crashhelper_disable_art_image_",
            ":gmplugin_disable_art_image_",
            ":socket_disable_art_image_",
            ":gpu_disable_art_image_",
            ":rdd_disable_art_image_",
            ":utility_disable_art_image_",
            ":ipdlunittest_disable_art_image_",
            ":zygoteTab_disable_art_image_",
        )
        val indexedBoundaries = listOf(
            ":tab_disable_art_image_0",
            ":tab_disable_art_image_39",
            ":isolatedTab_disable_art_image_0",
            ":isolatedTab_disable_art_image_39",
        )

        (fixedSuffixes + indexedBoundaries).forEach { suffix ->
            assertTrue(suffix, BrowserProcessController.isOwnedBrowserProcessName(packageName, packageName + suffix))
        }
    }

    @Test
    fun `rejects out of range malformed unrelated and foreign process names`() {
        val rejected = listOf(
            packageName,
            "$packageName:gecko_prototype",
            "$packageName:sync",
            "$packageName:tab_disable_art_image_40",
            "$packageName:isolatedTab_disable_art_image_40",
            "$packageName:tab_disable_art_image_00",
            "$packageName:tab_disable_art_image_-1",
            "$packageName:tab_disable_art_image_x",
            "$packageName:tab_disable_art_image_1_extra",
            "com.example.app:browser",
            "${packageName}suffix:browser",
        )

        rejected.forEach { processName ->
            assertFalse(processName, BrowserProcessController.isOwnedBrowserProcessName(packageName, processName))
        }
    }
}

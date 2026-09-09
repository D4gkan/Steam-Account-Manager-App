package com.steamaccountmanager.app

import androidx.room.Room
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.steamaccountmanager.app.data.database.AppDatabase
import com.steamaccountmanager.app.data.repository.AccountRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Covers Section 37 "Account tests" and "Persistence tests" using a real
 * (in-memory) Room database on-device, exercising the actual DAO/SQL layer
 * rather than a fake.
 */
@RunWith(AndroidJUnit4::class)
class AccountRepositoryTest {

    private lateinit var db: AppDatabase
    private lateinit var repository: AccountRepository

    @Before
    fun setUp() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java).allowMainThreadQueries().build()
        repository = AccountRepository(db.accountDao())
    }

    @After
    fun tearDown() {
        db.close()
    }

    @Test
    fun createAccount_preservesUserProvidedDisplayName() = runBlocking {
        val account = repository.createAccount("OW")
        assertEquals("OW", account.displayName)
    }

    @Test
    fun renameAccount_updatesDisplayNameOnly() = runBlocking {
        val account = repository.createAccount("OW")
        repository.renameAccount(account.id, "OW-Trading")
        val reloaded = repository.getAccount(account.id)
        assertEquals("OW-Trading", reloaded?.displayName)
    }

    @Test
    fun reorder_persistsAcrossReads() = runBlocking {
        val ow = repository.createAccount("OW")
        val crane = repository.createAccount("CRANE")
        val bear = repository.createAccount("BEAR")

        // New order: BEAR, OW, CRANE
        repository.reorder(listOf(bear.id, ow.id, crane.id))

        val ordered = repository.observeAccounts().first()
        assertEquals(listOf("BEAR", "OW", "CRANE"), ordered.map { it.displayName })
    }

    @Test
    fun addingAfterDeletionAppendsWithoutTiedPositions() = runBlocking {
        val first = repository.createAccount("First")
        val second = repository.createAccount("Second")
        val third = repository.createAccount("Third")
        repository.deleteAccount(second)
        val added = repository.createAccount("Added")
        val rows = repository.observeAccounts().first()
        assertEquals(listOf(first.id, third.id, added.id), rows.map { it.id })
        assertEquals(rows.size, rows.map { it.sortOrder }.distinct().size)
    }

    @Test
    fun deleteAccount_removesItButNotOthers() = runBlocking {
        val ow = repository.createAccount("OW")
        val crane = repository.createAccount("CRANE")

        repository.deleteAccount(ow)

        val remaining = repository.observeAccounts().first()
        assertEquals(listOf(crane.id), remaining.map { it.id })
    }
}

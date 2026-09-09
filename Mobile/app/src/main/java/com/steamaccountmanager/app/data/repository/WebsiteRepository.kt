package com.steamaccountmanager.app.data.repository

import com.steamaccountmanager.app.data.database.WebsiteEntity
import com.steamaccountmanager.app.data.database.dao.WebsiteDao
import com.steamaccountmanager.app.domain.model.BuiltInWebsites
import com.steamaccountmanager.app.domain.model.Website
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.net.URI
import java.util.UUID

sealed class AddWebsiteResult {
    data class Success(val website: Website) : AddWebsiteResult()
    data class Failure(val reason: String) : AddWebsiteResult()
}

/**
 * Data-driven website catalogue. Built-in sites are seeded once; everything after
 * that -- including the built-ins -- is just rows in the `websites` table, so
 * adding a new supported site later (built-in or user-added) never requires
 * touching the browser/session layer.
 */
class WebsiteRepository(private val websiteDao: WebsiteDao) {

    suspend fun seedBuiltInsIfNeeded() {
        BuiltInWebsites.all.forEach { websiteDao.insertIfAbsent(it.toEntity()) }
    }

    fun observeEnabledWebsites(): Flow<List<Website>> =
        websiteDao.observeEnabled().map { entities -> entities.map { it.toDomain() } }

    fun observeAllWebsites(): Flow<List<Website>> =
        websiteDao.observeAll().map { entities -> entities.map { it.toDomain() } }

    suspend fun getWebsite(id: String): Website? = websiteDao.getById(id)?.toDomain()

    suspend fun setEnabled(id: String, enabled: Boolean) {
        val existing = websiteDao.getById(id) ?: return
        websiteDao.update(existing.copy(isEnabled = enabled))
    }

    suspend fun addCustomWebsite(name: String, rawUrl: String): AddWebsiteResult {
        val trimmedName = name.trim()
        if (trimmedName.isEmpty()) return AddWebsiteResult.Failure("Please enter a website name.")

        val uri = try {
            URI(rawUrl.trim())
        } catch (_: Exception) {
            return AddWebsiteResult.Failure("That doesn't look like a valid URL.")
        }

        if (uri.scheme?.lowercase() != "https") {
            return AddWebsiteResult.Failure("Custom websites must use HTTPS.")
        }
        val domain = uri.host?.lowercase()
        if (domain.isNullOrBlank()) {
            return AddWebsiteResult.Failure("Couldn't determine the website's domain.")
        }
        if (websiteDao.countByDomain(domain) > 0) {
            return AddWebsiteResult.Failure("A website for this domain already exists.")
        }

        val website = Website(
            id = "custom_${UUID.randomUUID()}",
            name = trimmedName,
            url = uri.toString(),
            domain = domain,
            allowedAuthDomains = emptyList(),
            iconRes = null,
            isBuiltIn = false,
            isEnabled = true,
            sortOrder = 1000,
        )
        websiteDao.upsert(website.toEntity())
        return AddWebsiteResult.Success(website)
    }

    suspend fun deleteCustomWebsite(website: Website) {
        if (website.isBuiltIn) return // built-ins can be disabled, never deleted
        websiteDao.delete(website.toEntity())
    }
}

private fun WebsiteEntity.toDomain() = Website(
    id = id,
    name = name,
    url = url,
    domain = domain,
    allowedAuthDomains = allowedAuthDomainsCsv.split(",").filter { it.isNotBlank() },
    iconRes = iconRes,
    isBuiltIn = isBuiltIn,
    isEnabled = isEnabled,
    sortOrder = sortOrder,
)

private fun Website.toEntity() = WebsiteEntity(
    id = id,
    name = name,
    url = url,
    domain = domain,
    allowedAuthDomainsCsv = allowedAuthDomains.joinToString(","),
    iconRes = iconRes,
    isBuiltIn = isBuiltIn,
    isEnabled = isEnabled,
    sortOrder = sortOrder,
)

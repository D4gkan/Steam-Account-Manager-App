package com.steamaccountmanager.app.domain.model

/**
 * A data-driven definition of a site the app can open in an isolated session.
 * New sites (built-in or user-added) are just new rows of this shape -- nothing
 * about the browser/session layer is hard-coded to a fixed list of sites.
 */
data class Website(
    val id: String,
    val name: String,
    val url: String,
    /** Registrable domain used for allowlist matching, e.g. "csfloat.com". */
    val domain: String,
    /** Additional domains allowed during login/auth redirects (e.g. steamcommunity.com for
     *  a site that lets you "Sign in through Steam"). Empty for most sites. */
    val allowedAuthDomains: List<String> = emptyList(),
    val iconRes: String? = null,
    val isBuiltIn: Boolean,
    val isEnabled: Boolean = true,
    val sortOrder: Int = 0,
)

/** Seed data for the websites the app ships with. Editable/extensible at runtime via Room. */
object BuiltInWebsites {
    val STEAM = Website(
        id = "steam",
        name = "Steam",
        url = "https://steamcommunity.com/login/home/?goto=",
        domain = "steamcommunity.com",
        allowedAuthDomains = listOf("store.steampowered.com", "help.steampowered.com", "login.steampowered.com"),
        iconRes = "steam.ico",
        isBuiltIn = true,
        sortOrder = 0,
    )
    val CSFLOAT = Website(
        id = "csfloat",
        name = "CSFloat",
        url = "https://csfloat.com/",
        domain = "csfloat.com",
        allowedAuthDomains = listOf(
            "steamcommunity.com",
            "login.steampowered.com",
            "csgofloat.com",
            "www.csgofloat.com",
        ),
        iconRes = "csfloat.ico",
        isBuiltIn = true,
        sortOrder = 1,
    )
    val CSMONEY = Website(
        id = "csmoney",
        name = "CS.MONEY",
        url = "https://cs.money/",
        domain = "cs.money",
        allowedAuthDomains = listOf(
            "steamcommunity.com",
            "login.steampowered.com",
            "csmoney.com",
            "dota.trade",
            "auth.dota.trade",
        ),
        iconRes = "csmoney.ico",
        isBuiltIn = true,
        sortOrder = 2,
    )
    val SKINS_COM = Website(
        id = "skins_com",
        name = "Skins.com",
        url = "https://skins.com/",
        domain = "skins.com",
        allowedAuthDomains = listOf(
            "steamcommunity.com",
            "login.steampowered.com",
            "skins.com",
        ),
        iconRes = "skins.ico",
        isBuiltIn = true,
        sortOrder = 3,
    )
    val CSGOEMPIRE = Website(
        id = "csgoempire",
        name = "CSGOEmpire",
        url = "https://csgoempire.com/",
        domain = "csgoempire.com",
        allowedAuthDomains = listOf(
            "steamcommunity.com",
            "login.steampowered.com",
            "csgoempire.com",
            "csgoempirelogin.com",
            "csgoempirelogin6.com",
            "www.csgoempirelogin6.com",
        ),
        iconRes = "csgoempire.ico",
        isBuiltIn = true,
        sortOrder = 4,
    )

    val all = listOf(STEAM, CSFLOAT, CSMONEY, SKINS_COM, CSGOEMPIRE)
}

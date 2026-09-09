package com.steamaccountmanager.app.ui.navigation

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object AddAccount : Screen("add_account")
    data object WebsiteSelection : Screen("account/{accountId}") {
        fun createRoute(accountId: String) = "account/$accountId"
        const val ARG_ACCOUNT_ID = "accountId"
    }
    data object Settings : Screen("settings")
    data object CustomWebsites : Screen("settings/custom_websites")
}

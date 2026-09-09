package com.steamaccountmanager.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.steamaccountmanager.app.ui.AppViewModelFactory
import com.steamaccountmanager.app.ui.account.AddAccountScreen
import com.steamaccountmanager.app.ui.account.AddAccountViewModel
import com.steamaccountmanager.app.ui.account.WebsiteSelectionScreen
import com.steamaccountmanager.app.ui.account.WebsiteSelectionViewModel
import com.steamaccountmanager.app.ui.home.HomeScreen
import com.steamaccountmanager.app.ui.home.HomeViewModel
import com.steamaccountmanager.app.ui.lock.AppLockActivity
import com.steamaccountmanager.app.ui.navigation.Screen
import com.steamaccountmanager.app.ui.settings.SettingsScreen
import com.steamaccountmanager.app.ui.settings.SettingsViewModel
import com.steamaccountmanager.app.ui.theme.SteamAccountManagerTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as SteamAccountManagerApp
        val lockRequired = app.secureCredentialStore.isAppLockEnabled() && !app.unlockedForProcess
        if (lockRequired) {
            startActivity(Intent(this, AppLockActivity::class.java))
            finish()
            return
        }

        // Sections 18/19: hide this app's content from the recent-apps thumbnail
        // (secure window snapshot), but explicitly do NOT set FLAG_SECURE -- the
        // user wants screenshots/screen-recording to keep working while the app is
        // actually in the foreground. setRecentsScreenshotEnabled(false) achieves
        // exactly that split on API 33+: no recents thumbnail, but on-screen
        // capture (screenshot/recording) is unaffected.
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            setRecentsScreenshotEnabled(false)
        }

        setContent {
            SteamAccountManagerTheme {
                AppNavHost(app)
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun AppNavHost(app: SteamAccountManagerApp) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Screen.Home.route) {
        composable(Screen.Home.route) {
            val viewModel: HomeViewModel = viewModel(factory = AppViewModelFactory(app))
            HomeScreen(
                viewModel = viewModel,
                onAccountClick = { account -> navController.navigate(Screen.WebsiteSelection.createRoute(account.id)) },
                onAddAccountClick = { navController.navigate(Screen.AddAccount.route) },
                onSettingsClick = { navController.navigate(Screen.Settings.route) },
            )
        }
        composable(Screen.AddAccount.route) {
            val viewModel: AddAccountViewModel = viewModel(factory = AppViewModelFactory(app))
            AddAccountScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onAccountReadyForSteamLogin = { accountId ->
                    // Replaces AddAccount in the back stack with the website selector
                    // for the brand-new account, pre-selected to jump straight into
                    // Steam login per the Section 5 flow.
                    navController.navigate(Screen.WebsiteSelection.createRoute(accountId)) {
                        popUpTo(Screen.Home.route)
                    }
                },
            )
        }
        composable(
            route = Screen.WebsiteSelection.route,
            arguments = listOf(navArgument(Screen.WebsiteSelection.ARG_ACCOUNT_ID) { type = NavType.StringType }),
        ) { backStackEntry ->
            val accountId = requireNotNull(backStackEntry.arguments?.getString(Screen.WebsiteSelection.ARG_ACCOUNT_ID))
            val viewModel: WebsiteSelectionViewModel = viewModel(
                factory = AppViewModelFactory(app, accountIdForWebsiteSelection = accountId),
            )
            WebsiteSelectionScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
        composable(Screen.Settings.route) {
            val viewModel: SettingsViewModel = viewModel(factory = AppViewModelFactory(app))
            SettingsScreen(viewModel = viewModel, onBack = { navController.popBackStack() })
        }
    }
}

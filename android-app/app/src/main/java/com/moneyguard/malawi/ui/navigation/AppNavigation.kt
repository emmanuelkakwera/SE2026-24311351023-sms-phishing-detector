package com.moneyguard.malawi.ui.navigation

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.moneyguard.malawi.AppContainer
import com.moneyguard.malawi.ui.screens.DetectionDetailsScreen
import com.moneyguard.malawi.ui.screens.HistoryScreen
import com.moneyguard.malawi.ui.screens.HomeScreen
import com.moneyguard.malawi.ui.screens.SettingsScreen
import com.moneyguard.malawi.ui.viewmodel.AppViewModelFactory
import com.moneyguard.malawi.ui.viewmodel.DetectionDetailsViewModel
import com.moneyguard.malawi.ui.viewmodel.HistoryViewModel
import com.moneyguard.malawi.ui.viewmodel.HomeViewModel
import com.moneyguard.malawi.ui.viewmodel.ProtectionViewModel

@Composable
fun AppNavigation(
    container: AppContainer,
    initialDetectionId: String?
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val navController = rememberNavController()
    val factory = remember(container) { AppViewModelFactory(container) }
    val homeViewModel: HomeViewModel = viewModel(factory = factory)
    val historyViewModel: HistoryViewModel = viewModel(factory = factory)
    val protectionViewModel: ProtectionViewModel = viewModel(factory = factory)

    val homeState by homeViewModel.uiState.collectAsStateWithLifecycle()
    val historyState by historyViewModel.uiState.collectAsStateWithLifecycle()
    val protectionState by protectionViewModel.uiState.collectAsStateWithLifecycle()
    var showPermissionRationale by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        if (results[Manifest.permission.RECEIVE_SMS] == true) {
            protectionViewModel.setMonitoringEnabled(true)
        } else {
            protectionViewModel.refresh()
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) protectionViewModel.refresh()
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(initialDetectionId) {
        if (!initialDetectionId.isNullOrBlank()) {
            navController.navigate(Routes.detectionDetails(initialDetectionId)) {
                launchSingleTop = true
            }
        }
    }

    val currentRoute = navController.currentBackStackEntryAsState()
        .value?.destination?.route
    val onNavigateTab: (String) -> Unit = { route ->
        if (route != currentRoute) {
            navController.navigate(route) {
                popUpTo(Routes.HOME) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }
    val requestProtection = { showPermissionRationale = true }
    val openAppSettings = {
        val intent = Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", context.packageName, null)
        )
        context.startActivity(intent)
    }

    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(Routes.HOME) {
            HomeScreen(
                state = homeState,
                protectionState = protectionState,
                onNavigateTab = onNavigateTab,
                onOpenDetection = { id ->
                    navController.navigate(Routes.detectionDetails(id)) {
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Routes.HISTORY) {
            HistoryScreen(
                state = historyState,
                onNavigateTab = onNavigateTab,
                onFilterChange = historyViewModel::setFilter,
                onOpenDetection = { id ->
                    navController.navigate(Routes.detectionDetails(id)) {
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                protectionState = protectionState,
                onNavigateTab = onNavigateTab,
                onRequestProtection = requestProtection,
                onOpenAppSettings = openAppSettings,
                onMonitoringChange = protectionViewModel::setMonitoringEnabled,
                onClearHistory = historyViewModel::clearHistory
            )
        }

        composable(
            route = Routes.DETECTION_DETAILS,
            arguments = listOf(
                navArgument(Routes.DETECTION_ID_ARG) { type = NavType.StringType }
            )
        ) { entry ->
            val detectionId = entry.arguments
                ?.getString(Routes.DETECTION_ID_ARG)
                .orEmpty()
            val detailsViewModel: DetectionDetailsViewModel = viewModel(
                key = "detection_details_$detectionId",
                factory = DetectionDetailsViewModel.factory(
                    container.detectionRepository,
                    detectionId
                )
            )
            val detailsState by detailsViewModel.uiState.collectAsStateWithLifecycle()

            DetectionDetailsScreen(
                state = detailsState,
                isPreview = false,
                onBack = { navController.navigateBackOrHome() }
            )
        }
    }

    if (showPermissionRationale) {
        AlertDialog(
            onDismissRequest = { showPermissionRationale = false },
            title = { Text("Turn on SMS protection") },
            text = {
                Text(
                    "MoneyGuard needs SMS permission to inspect ordinary incoming carrier " +
                        "messages as they arrive. Analysis runs on this phone; messages are " +
                        "not changed or deleted. Notification permission lets MoneyGuard " +
                        "warn you when a message is classified as fraud. RCS and chat apps " +
                        "are not monitored."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showPermissionRationale = false
                        val permissions = buildList {
                            add(Manifest.permission.RECEIVE_SMS)
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                add(Manifest.permission.POST_NOTIFICATIONS)
                            }
                        }
                        permissionLauncher.launch(permissions.toTypedArray())
                    }
                ) {
                    Text("Continue")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPermissionRationale = false }) {
                    Text("Not now")
                }
            }
        )
    }
}

private fun NavHostController.navigateBackOrHome() {
    if (!popBackStack()) {
        navigate(Routes.HOME) { launchSingleTop = true }
    }
}

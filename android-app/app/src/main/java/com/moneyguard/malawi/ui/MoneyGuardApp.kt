package com.moneyguard.malawi.ui

import androidx.compose.runtime.Composable
import com.moneyguard.malawi.AppContainer
import com.moneyguard.malawi.ui.navigation.AppNavigation

/**
 * Root composable for MoneyGuard. Navigation owns the screen graph and the
 * bottom navigation bar; individual screens stay focused on presentation.
 */
@Composable
fun MoneyGuardApp(container: AppContainer, initialDetectionId: String?) {
    AppNavigation(
        container = container,
        initialDetectionId = initialDetectionId
    )
}

package com.moneyguard.malawi.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.moneyguard.malawi.BuildConfig
import com.moneyguard.malawi.domain.model.ProtectionStatus
import com.moneyguard.malawi.ui.components.MainScaffold
import com.moneyguard.malawi.ui.components.SectionHeader
import com.moneyguard.malawi.ui.components.SettingsCard
import com.moneyguard.malawi.ui.components.SettingsRow
import com.moneyguard.malawi.ui.components.StatusPill
import com.moneyguard.malawi.ui.navigation.Routes
import com.moneyguard.malawi.ui.theme.MoneyGuardIcons
import com.moneyguard.malawi.ui.viewmodel.ProtectionUiState

@Composable
fun SettingsScreen(
    protectionState: ProtectionUiState,
    onNavigateTab: (String) -> Unit,
    onRequestProtection: () -> Unit,
    onOpenAppSettings: () -> Unit,
    onMonitoringChange: (Boolean) -> Unit,
    onClearHistory: () -> Unit
) {
    var confirmClear by remember { mutableStateOf(false) }

    MainScaffold(
        title = { Text("Settings") },
        currentRoute = Routes.SETTINGS,
        onNavigateTab = onNavigateTab
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(
                start = 20.dp,
                top = 8.dp,
                end = 20.dp,
                bottom = 28.dp
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                SectionHeader(title = "Protection")
            }
            item {
                SettingsCard {
                    SettingsRow(
                        icon = MoneyGuardIcons.Shield,
                        title = "Protection status",
                        subtitle = protectionDescription(protectionState),
                        trailing = {
                            StatusPill(
                                text = protectionState.status.label,
                                containerColor = when (protectionState.status) {
                                    ProtectionStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                    ProtectionStatus.ALERTS_BLOCKED ->
                                        MaterialTheme.colorScheme.tertiaryContainer
                                    else -> MaterialTheme.colorScheme.errorContainer
                                },
                                contentColor = when (protectionState.status) {
                                    ProtectionStatus.ACTIVE ->
                                        MaterialTheme.colorScheme.onPrimaryContainer
                                    ProtectionStatus.ALERTS_BLOCKED ->
                                        MaterialTheme.colorScheme.onTertiaryContainer
                                    else -> MaterialTheme.colorScheme.onErrorContainer
                                }
                            )
                        }
                    )
                    HorizontalDivider()
                    SettingsRow(
                        icon = MoneyGuardIcons.Message,
                        title = "SMS permission",
                        subtitle = "Required to analyse newly received ordinary SMS.",
                        trailing = { Text(permissionLabel(protectionState.smsPermissionGranted)) }
                    )
                    HorizontalDivider()
                    SettingsRow(
                        icon = Icons.Rounded.Notifications,
                        title = "Notification permission",
                        subtitle = "Required for immediate fraud warning notifications.",
                        trailing = {
                            Text(permissionLabel(protectionState.notificationPermissionGranted))
                        }
                    )
                    HorizontalDivider()
                    SettingsRow(
                        icon = MoneyGuardIcons.Shield,
                        title = "Automatic monitoring",
                        subtitle = if (protectionState.monitoringEnabled) {
                            "New carrier SMS is checked in the background."
                        } else {
                            "Monitoring is off; incoming messages are not being checked."
                        },
                        trailing = {
                            Switch(
                                checked = protectionState.monitoringEnabled,
                                enabled = protectionState.canEnable ||
                                    protectionState.monitoringEnabled,
                                onCheckedChange = { checked ->
                                    if (checked && !protectionState.canEnable) {
                                        onRequestProtection()
                                    } else {
                                        onMonitoringChange(checked)
                                    }
                                }
                            )
                        }
                    )
                }
            }

            if (!protectionState.smsPermissionGranted ||
                !protectionState.notificationPermissionGranted
            ) {
                item {
                    androidx.compose.material3.Button(
                        onClick = onRequestProtection,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Review permissions")
                    }
                }
            }

            if (protectionState.error != null) {
                item {
                    Text(
                        text = protectionState.error,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            item {
                TextButton(onClick = onOpenAppSettings) {
                    Text("Open Android app settings")
                }
            }

            item {
                SectionHeader(title = "Privacy")
            }
            item {
                SettingsCard {
                    SettingsRow(
                        icon = Icons.Rounded.Lock,
                        title = "On-device processing",
                        subtitle = "Incoming SMS text is classified locally and is not uploaded."
                    )
                    HorizontalDivider()
                    SettingsRow(
                        icon = Icons.Rounded.Info,
                        title = "Ordinary SMS only",
                        subtitle = "MoneyGuard does not replace your SMS app or monitor RCS, WhatsApp, or other chat apps."
                    )
                }
            }

            item {
                SectionHeader(title = "Detection history")
            }
            item {
                SettingsCard {
                    SettingsRow(
                        icon = MoneyGuardIcons.Delete,
                        title = "Clear detection history",
                        subtitle = "Remove all locally stored SMS detection records.",
                        onClick = { confirmClear = true }
                    )
                }
            }

            item {
                SectionHeader(title = "About")
            }
            item {
                SettingsCard {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "MoneyGuard",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "Mobile Money Security · Version ${BuildConfig.VERSION_NAME}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = { Text("Clear detection history?") },
            text = { Text("This permanently removes all locally stored detection records.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmClear = false
                        onClearHistory()
                    }
                ) {
                    Text("Clear")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmClear = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

private fun protectionDescription(state: ProtectionUiState): String = when {
    !state.modelReady -> "${state.classifierStatus.code}: ${state.classifierMessage}"
    !state.smsPermissionGranted -> "Grant SMS permission to begin protection."
    !state.monitoringEnabled -> "Monitoring is paused."
    !state.notificationPermissionGranted ->
        "SMS is analysed, but fraud alerts cannot be shown until notifications are allowed."
    else -> "Incoming ordinary SMS is analysed and fraud alerts are enabled."
}

private fun permissionLabel(granted: Boolean): String =
    if (granted) "Granted" else "Not granted"

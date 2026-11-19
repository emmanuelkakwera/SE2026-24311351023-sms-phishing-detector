package com.moneyguard.malawi.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.moneyguard.malawi.domain.model.DetectionRecord
import com.moneyguard.malawi.domain.model.ProtectionStatus
import com.moneyguard.malawi.ui.components.BrandTitle
import com.moneyguard.malawi.ui.components.ClassificationPill
import com.moneyguard.malawi.ui.components.MainScaffold
import com.moneyguard.malawi.ui.components.SectionHeader
import com.moneyguard.malawi.ui.navigation.Routes
import com.moneyguard.malawi.ui.theme.DarkSuccess
import com.moneyguard.malawi.ui.theme.MoneyGuardIcons
import com.moneyguard.malawi.ui.theme.MoneySuccess
import com.moneyguard.malawi.ui.viewmodel.HomeUiState
import com.moneyguard.malawi.ui.viewmodel.ProtectionUiState
import com.moneyguard.malawi.utils.formatDetectionTimestamp

/**
 * Home is deliberately stats-first. Protection is a small readiness light and
 * label in the top bar; detailed readiness information lives in Settings.
 */
@Composable
fun HomeScreen(
    state: HomeUiState,
    protectionState: ProtectionUiState,
    onNavigateTab: (String) -> Unit,
    onOpenDetection: (String) -> Unit,
) {
    MainScaffold(
        title = { BrandTitle() },
        currentRoute = Routes.HOME,
        onNavigateTab = onNavigateTab,
        actions = { ProtectionIndicator(status = protectionState.status) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(
                start = 20.dp,
                top = 10.dp,
                end = 20.dp,
                bottom = 28.dp
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Your SMS protection overview",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    MetricTile(
                        value = state.totalAnalysed.toString(),
                        label = "SMS Analysed",
                        caption = "Incoming messages",
                        modifier = Modifier.weight(1f)
                    )
                    MetricTile(
                        value = state.fraudulentDetected.toString(),
                        label = "Fraud Detected",
                        caption = "Suspicious messages",
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                MetricTile(
                    value = state.legitimateDetected.toString(),
                    label = "Legitimate Messages",
                    caption = "Messages classified as normal",
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                SectionHeader(
                    title = "Recent detection activity",
                    actionLabel = "View all",
                    onAction = { onNavigateTab(Routes.HISTORY) }
                )
            }

            if (state.recentDetections.isEmpty()) {
                item { EmptyDetectionState() }
            } else {
                items(
                    items = state.recentDetections,
                    key = { record -> record.id }
                ) { record ->
                    RecentDetectionRow(
                        record = record,
                        onClick = { onOpenDetection(record.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun ProtectionIndicator(status: ProtectionStatus) {
    val active = status == ProtectionStatus.ACTIVE
    val indicatorColor = if (active) {
        if (isSystemInDarkTheme()) DarkSuccess else MoneySuccess
    } else {
        MaterialTheme.colorScheme.error
    }
    val label = if (active) "ACTIVE" else "INACTIVE"

    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(
            modifier = Modifier.size(9.dp),
            shape = CircleShape,
            color = indicatorColor,
            content = {}
        )
        Spacer(Modifier.width(7.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = indicatorColor
        )
    }
}

@Composable
private fun MetricTile(
    value: String,
    label: String,
    caption: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = MaterialTheme.shapes.small,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = caption,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun RecentDetectionRow(
    record: DetectionRecord,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = MaterialTheme.shapes.small,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = record.sender,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = formatDetectionTimestamp(record.timestampMillis),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(Modifier.width(8.dp))
                ClassificationPill(classification = record.classification)
            }
            Spacer(Modifier.height(10.dp))
            Text(
                text = record.preview,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun EmptyDetectionState() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.small,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No detections yet",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Incoming SMS will appear here after it is analysed.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

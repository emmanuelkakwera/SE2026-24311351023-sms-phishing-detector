package com.moneyguard.malawi.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.moneyguard.malawi.domain.model.DetectionFilter
import com.moneyguard.malawi.ui.components.DetectionCard
import com.moneyguard.malawi.ui.components.EmptyState
import com.moneyguard.malawi.ui.components.MainScaffold
import com.moneyguard.malawi.ui.navigation.Routes
import com.moneyguard.malawi.ui.theme.MoneyGuardIcons
import com.moneyguard.malawi.ui.viewmodel.HistoryUiState

@Composable
fun HistoryScreen(
    state: HistoryUiState,
    onNavigateTab: (String) -> Unit,
    onFilterChange: (DetectionFilter) -> Unit,
    onOpenDetection: (String) -> Unit
) {
    MainScaffold(
        title = { Text("Detection History") },
        currentRoute = Routes.HISTORY,
        onNavigateTab = onNavigateTab
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DetectionFilter.entries.forEach { filter ->
                    FilterChip(
                        selected = state.filter == filter,
                        onClick = { onFilterChange(filter) },
                        label = { Text(filter.label) }
                    )
                }
            }

            when {
                state.isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                state.detections.isEmpty() -> {
                    val noRecordsAtAll = state.totalRecords == 0
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        EmptyState(
                            icon = MoneyGuardIcons.History,
                            title = if (noRecordsAtAll) {
                                "No detections yet"
                            } else {
                                "No matching detections"
                            },
                            message = when {
                                noRecordsAtAll ->
                                    "Newly received messages will appear here after on-device analysis."

                                state.filter == DetectionFilter.FRAUDULENT ->
                                    "No fraudulent messages match this filter."

                                state.filter == DetectionFilter.NORMAL ->
                                    "No normal messages match this filter."

                                else ->
                                    "No detections match the selected filter."
                            },
                            actionLabel = if (noRecordsAtAll) null else "Show all",
                            onAction = if (noRecordsAtAll) null else {
                                { onFilterChange(DetectionFilter.ALL) }
                            }
                        )
                    }
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentPadding = PaddingValues(
                            start = 20.dp,
                            top = 8.dp,
                            end = 20.dp,
                            bottom = 28.dp
                        ),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = state.detections,
                            key = { record -> record.id }
                        ) { record ->
                            DetectionCard(
                                record = record,
                                onClick = { onOpenDetection(record.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

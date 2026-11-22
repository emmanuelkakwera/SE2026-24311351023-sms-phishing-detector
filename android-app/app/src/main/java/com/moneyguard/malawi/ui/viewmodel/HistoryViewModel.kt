package com.moneyguard.malawi.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.moneyguard.malawi.data.detection.DetectionRepository
import com.moneyguard.malawi.domain.model.DetectionFilter
import com.moneyguard.malawi.domain.model.DetectionRecord
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class HistoryUiState(
    val detections: List<DetectionRecord> = emptyList(),
    val filter: DetectionFilter = DetectionFilter.ALL,
    val totalRecords: Int = 0,
    val isLoading: Boolean = true
)

class HistoryViewModel(
    private val detectionRepository: DetectionRepository
) : ViewModel() {

    private val filter = MutableStateFlow(DetectionFilter.ALL)

    val uiState: StateFlow<HistoryUiState> = combine(
        detectionRepository.observeDetections(),
        filter
    ) { records, selectedFilter ->
        HistoryUiState(
            detections = records
                .filter { record -> selectedFilter.matches(record) }
                .sortedByDescending { record -> record.timestampMillis },
            filter = selectedFilter,
            totalRecords = records.size,
            isLoading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HistoryUiState()
    )

    fun setFilter(value: DetectionFilter) {
        filter.value = value
    }

    fun deleteDetection(id: String) {
        viewModelScope.launch {
            detectionRepository.deleteDetection(id)
        }
    }

    fun pruneOlderThan(cutoffTimestampMillis: Long) {
        viewModelScope.launch {
            detectionRepository.deleteOlderThan(cutoffTimestampMillis)
        }
    }

    fun clearHistory() {
        viewModelScope.launch {
            detectionRepository.clearHistory()
        }
    }
}

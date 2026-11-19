package com.moneyguard.malawi.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.moneyguard.malawi.data.detection.DetectionRepository
import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import com.moneyguard.malawi.utils.greetingForHour
import java.time.LocalTime
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeUiState(
    val greeting: String = "Welcome",
    val totalAnalysed: Int = 0,
    val fraudulentDetected: Int = 0,
    val legitimateDetected: Int = 0,
    val recentDetections: List<DetectionRecord> = emptyList(),
    val isLoading: Boolean = true
)

data class DetectionSummary(
    val totalAnalysed: Int,
    val fraudulentDetected: Int,
    val legitimateDetected: Int,
    val recentDetections: List<DetectionRecord>
)

/** Dashboard numbers are derived only from persisted detection records. */
fun summarizeDetectionRecords(records: List<DetectionRecord>): DetectionSummary {
    val analysed = records.filter { record ->
        record.classification == DetectionClassification.FRAUDULENT ||
            record.classification == DetectionClassification.LEGITIMATE
    }
    return DetectionSummary(
        totalAnalysed = analysed.size,
        fraudulentDetected = analysed.count { it.classification == DetectionClassification.FRAUDULENT },
        legitimateDetected = analysed.count { it.classification == DetectionClassification.LEGITIMATE },
        recentDetections = records.sortedByDescending { it.timestampMillis }.take(3)
    )
}

class HomeViewModel(
    detectionRepository: DetectionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(
        HomeUiState(greeting = greetingForHour(LocalTime.now().hour))
    )
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            detectionRepository.observeDetections().collect { records ->
                val summary = summarizeDetectionRecords(records)
                _uiState.update {
                    it.copy(
                        totalAnalysed = summary.totalAnalysed,
                        fraudulentDetected = summary.fraudulentDetected,
                        legitimateDetected = summary.legitimateDetected,
                        recentDetections = summary.recentDetections,
                        isLoading = false
                    )
                }
            }
        }
    }
}

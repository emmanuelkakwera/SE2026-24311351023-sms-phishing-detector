package com.moneyguard.malawi.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.moneyguard.malawi.data.detection.DetectionRepository
import com.moneyguard.malawi.domain.model.DetectionRecord
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import androidx.lifecycle.ViewModelProvider

data class DetectionDetailsUiState(
    val detection: DetectionRecord? = null,
    val isLoading: Boolean = true
)

class DetectionDetailsViewModel(
    detectionRepository: DetectionRepository,
    detectionId: String
) : ViewModel() {

    private val _uiState = MutableStateFlow(DetectionDetailsUiState())
    val uiState: StateFlow<DetectionDetailsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            _uiState.value = DetectionDetailsUiState(
                detection = detectionRepository.getDetection(detectionId),
                isLoading = false
            )
        }
    }

    companion object {
        fun factory(
            detectionRepository: DetectionRepository,
            detectionId: String
        ): ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                return DetectionDetailsViewModel(detectionRepository, detectionId) as T
            }
        }
    }
}

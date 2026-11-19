package com.moneyguard.malawi.ui.viewmodel

import android.Manifest
import android.content.ComponentName
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.moneyguard.malawi.BuildConfig
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.moneyguard.malawi.AppContainer
import com.moneyguard.malawi.data.classifier.ClassifierLoadStatus
import com.moneyguard.malawi.domain.model.ProtectionStatus
import com.moneyguard.malawi.domain.protection.evaluateProtectionReadiness
import com.moneyguard.malawi.notifications.DetectionNotificationHelper
import com.moneyguard.malawi.receiver.SmsReceiver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class ProtectionUiState(
    val smsPermissionGranted: Boolean = false,
    val notificationPermissionGranted: Boolean = false,
    val monitoringEnabled: Boolean = false,
    val modelReady: Boolean = false,
    val classifierStatus: ClassifierLoadStatus = ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED,
    val classifierDetail: String? = null,
    val receiverConfigured: Boolean = false,
    val isLoading: Boolean = true,
    val error: String? = null
) {
    val status: ProtectionStatus
        get() = when {
            !smsPermissionGranted -> ProtectionStatus.NOT_CONFIGURED
            !monitoringEnabled -> ProtectionStatus.INACTIVE
            !modelReady || !receiverConfigured -> ProtectionStatus.INACTIVE
            !notificationPermissionGranted -> ProtectionStatus.ALERTS_BLOCKED
            else -> ProtectionStatus.ACTIVE
        }

    val canEnable: Boolean
        get() = evaluateProtectionReadiness(
            smsPermissionGranted,
            notificationPermissionGranted,
            modelReady,
            receiverConfigured
        ).canEnable

    val classifierMessage: String
        get() = if (classifierDetail.isNullOrBlank()) {
            classifierStatus.message
        } else {
            "${classifierStatus.message} $classifierDetail"
        }
}

class ProtectionViewModel(
    private val container: AppContainer
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProtectionUiState())
    val uiState: StateFlow<ProtectionUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.value = readCurrentState()
        }
    }

    fun setMonitoringEnabled(enabled: Boolean) {
        viewModelScope.launch {
            val current = readCurrentState()
            if (enabled) {
                val readiness = evaluateProtectionReadiness(
                    current.smsPermissionGranted,
                    current.notificationPermissionGranted,
                    current.modelReady,
                    current.receiverConfigured
                )
                if (!readiness.canEnable) {
                    _uiState.value = current.copy(error = readiness.explanation)
                    return@launch
                }
            }
            container.protectionPreferences.setMonitoringEnabled(enabled)
            _uiState.value = readCurrentState().copy(error = null)
        }
    }

    private suspend fun readCurrentState(): ProtectionUiState {
        val context = container.applicationContext
        val classifierLoad = withContext(Dispatchers.IO) {
            container.classifierLoadResult
        }
        val modelReady = classifierLoad.isReady
        if (!modelReady && BuildConfig.DEBUG) {
            Log.e(
                TAG,
                "Classifier unavailable: ${classifierLoad.status.code}. ${classifierLoad.userMessage()}",
                classifierLoad.error
            )
        }

        val smsGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED
        val notificationsGranted = DetectionNotificationHelper.areAlertsEnabled(context)
        val monitoringEnabled = container.protectionPreferences.isMonitoringEnabled()
        val receiverConfigured = isReceiverConfigured(context)

        val readiness = evaluateProtectionReadiness(
            smsGranted,
            notificationsGranted,
            modelReady,
            receiverConfigured
        )

        return ProtectionUiState(
            smsPermissionGranted = smsGranted,
            notificationPermissionGranted = notificationsGranted,
            monitoringEnabled = monitoringEnabled,
            modelReady = modelReady,
            classifierStatus = classifierLoad.status,
            classifierDetail = classifierLoad.detail,
            receiverConfigured = receiverConfigured,
            isLoading = false,
            error = when {
                !modelReady ->
                    "${classifierLoad.status.code}: ${classifierLoad.userMessage()}"

                monitoringEnabled && !readiness.canEnable -> readiness.explanation

                else -> null
            }
        )
    }

    private fun isReceiverConfigured(context: android.content.Context): Boolean = try {
        context.packageManager.getReceiverInfo(
            ComponentName(context, SmsReceiver::class.java),
            0
        ).isEnabled
    } catch (_: PackageManager.NameNotFoundException) {
        false
    }

    private companion object {
        const val TAG = "MoneyGuardProtection"
    }
}

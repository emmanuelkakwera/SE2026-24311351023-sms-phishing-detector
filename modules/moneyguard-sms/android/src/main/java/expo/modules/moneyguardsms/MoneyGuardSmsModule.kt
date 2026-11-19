package expo.modules.moneyguardsms

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MoneyGuardSmsModule : Module() {
  private var detectionListener: ((Map<String, Any?>) -> Unit)? = null

  private val context: Context
    get() = appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("MoneyGuard SMS module is not attached to an Android context.")

  override fun definition() = ModuleDefinition {
    Name("MoneyGuardSms")
    Events("onDetection")

    OnCreate {
      appContext.reactContext?.applicationContext?.let { NotificationHelper.createChannels(it) }
    }

    OnStartObserving("onDetection") {
      val listener: (Map<String, Any?>) -> Unit = { payload ->
        sendEvent("onDetection", payload)
      }
      detectionListener = listener
      SmsEventBus.addListener(listener)
    }

    OnStopObserving("onDetection") {
      detectionListener?.let { SmsEventBus.removeListener(it) }
      detectionListener = null
    }

    AsyncFunction("getDetections") {
      SmsStore.readDetections(context).map { it.toMap() }
    }

    AsyncFunction("getDetection") { id: String ->
      SmsStore.findDetection(context, id)?.toMap()
    }

    AsyncFunction("deleteDetection") { id: String ->
      SmsStore.delete(context, id)
    }

    AsyncFunction("getSettings") {
      val settings = SmsStore.settings(context)
      mapOf(
        "monitoringEnabled" to settings.monitoringEnabled,
        "fraudAlertsEnabled" to settings.fraudAlertsEnabled,
        "notifyOnAnalysisFailure" to settings.notifyOnAnalysisFailure
      )
    }

    AsyncFunction("setSettings") {
        monitoringEnabled: Boolean,
        fraudAlertsEnabled: Boolean,
        notifyOnAnalysisFailure: Boolean,
      ->
      SmsStore.setSettings(
        context,
        NativeSettings(
          monitoringEnabled = monitoringEnabled,
          fraudAlertsEnabled = fraudAlertsEnabled,
          notifyOnAnalysisFailure = notifyOnAnalysisFailure
        )
      )
    }

    AsyncFunction("setMonitoringEnabled") { enabled: Boolean ->
      SmsStore.setMonitoringEnabled(context, enabled)
    }

    AsyncFunction("clearDetections") {
      SmsStore.clear(context)
    }

    AsyncFunction("deleteAllData") {
      SmsStore.deleteAllData(context)
    }

    AsyncFunction("hasSmsPermission") {
      ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) ==
        PackageManager.PERMISSION_GRANTED
    }

    AsyncFunction("hasNotificationPermission") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        true
      } else {
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
          PackageManager.PERMISSION_GRANTED
      }
    }

    AsyncFunction("analyzeMessage") { message: String, sender: String ->
      val body = message.trim()
      if (body.isEmpty()) {
        return@AsyncFunction mapOf(
          "status" to "not_analysed",
          "confidence" to null,
          "explanation" to "The message is empty.",
          "stored" to false,
          "detection" to null
        )
      }

      when (val outcome = OfflineSmsClassifier.analyze(context, body)) {
        is AnalysisOutcome.Fraudulent -> {
          val detection = SmsStore.newDetection(
            sender = sender,
            body = body,
            status = "FRAUD",
            confidence = outcome.confidence,
            fraudProbability = outcome.fraudProbability,
            normalProbability = outcome.normalProbability,
            explanation = outcome.explanation,
            signals = outcome.signals,
            timestamp = System.currentTimeMillis(),
            subscriptionId = null
          )
          SmsStore.record(context, detection)
          val settings = SmsStore.settings(context)
          if (settings.fraudAlertsEnabled) {
            NotificationHelper.showFraudAlert(context, detection)
          }
          SmsEventBus.emit(detection)
          mapOf(
            "status" to "fraud",
            "confidence" to outcome.confidence,
            "explanation" to outcome.explanation,
            "stored" to true,
            "detection" to detection.toMap()
          )
        }

        is AnalysisOutcome.Legitimate -> {
          val detection = SmsStore.newDetection(
            sender = sender,
            body = body,
            status = "NORMAL",
            confidence = outcome.confidence,
            fraudProbability = outcome.fraudProbability,
            normalProbability = outcome.normalProbability,
            explanation = outcome.explanation,
            signals = outcome.signals,
            timestamp = System.currentTimeMillis(),
            subscriptionId = null
          )
          SmsStore.record(context, detection)
          SmsEventBus.emit(detection)
          mapOf(
            "status" to "normal",
            "confidence" to outcome.confidence,
            "explanation" to outcome.explanation,
            "stored" to true,
            "detection" to detection.toMap()
          )
        }

        is AnalysisOutcome.Failure -> {
          val detection = SmsStore.newDetection(
            sender = sender,
            body = body,
            status = "NOT_ANALYSED",
            confidence = null,
            fraudProbability = null,
            normalProbability = null,
            explanation = outcome.explanation,
            signals = emptyList(),
            timestamp = System.currentTimeMillis(),
            subscriptionId = null
          )
          SmsStore.record(context, detection)
          val settings = SmsStore.settings(context)
          if (settings.notifyOnAnalysisFailure) {
            NotificationHelper.showAnalysisFailure(context, detection)
          }
          SmsEventBus.emit(detection)
          mapOf(
            "status" to "not_analysed",
            "confidence" to null,
            "explanation" to detection.explanation,
            "stored" to true,
            "detection" to detection.toMap()
          )
        }
      }
    }
  }
}

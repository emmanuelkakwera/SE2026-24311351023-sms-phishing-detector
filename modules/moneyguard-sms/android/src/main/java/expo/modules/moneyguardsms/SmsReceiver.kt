package expo.modules.moneyguardsms

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Telephony
import android.telephony.SmsMessage
import androidx.core.content.ContextCompat

/**
 * Receives SMS_RECEIVED without becoming the default SMS app. The broadcast is
 * non-abortable, so MoneyGuard cannot hide, modify, or delete the user's SMS.
 *
 * Every incoming carrier SMS is classified with the bundled on-device model.
 * Results are stored locally; fraudulent messages also produce a high-priority
 * notification. RCS, WhatsApp and other internet messages never reach this
 * receiver and are not claimed to be monitored.
 */
class SmsReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    if (!SmsStore.monitoringEnabled(context)) return

    val pendingResult = goAsync()
    val appContext = context.applicationContext
    Thread {
      try {
        analyzeMessages(appContext, intent)
      } catch (_: Throwable) {
        // A failed background check must never crash the receiver or the app.
      } finally {
        pendingResult.finish()
      }
    }.start()
  }

  private fun analyzeMessages(context: Context, intent: Intent) {
    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    if (messages.isEmpty()) return

    NotificationHelper.createChannels(context)
    val subscriptionId = intent.getIntExtra("subscription", -1)
    val grouped = LinkedHashMap<Pair<String, Int>, MutableList<SmsMessage>>()

    // A single SMS_RECEIVED broadcast contains every PDU of one message. Group
    // by sender + SIM so multipart bodies are joined in delivery order instead
    // of being analysed as separate fragments.
    for (message in messages) {
      val sender = message.displayOriginatingAddress
        ?: message.originatingAddress
        ?: "Unknown sender"
      grouped.getOrPut(sender to subscriptionId) { mutableListOf() }.add(message)
    }

    val settings = SmsStore.settings(context)
    for ((key, parts) in grouped) {
      val sender = key.first
      val body = parts.joinToString(separator = "") { it.messageBody ?: "" }.trim()
      if (body.isEmpty()) continue
      val timestamp = parts.firstOrNull()?.timestampMillis ?: System.currentTimeMillis()

      if (SmsStore.isDuplicate(context, sender, body, timestamp)) continue

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
            timestamp = timestamp,
            subscriptionId = if (subscriptionId >= 0) subscriptionId else null
          )
          SmsStore.record(context, detection)
          if (settings.fraudAlertsEnabled) {
            NotificationHelper.showFraudAlert(context, detection)
          }
          SmsEventBus.emit(detection)
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
            timestamp = timestamp,
            subscriptionId = if (subscriptionId >= 0) subscriptionId else null
          )
          // Legitimate messages are saved silently; no notification is raised.
          SmsStore.record(context, detection)
          SmsEventBus.emit(detection)
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
            timestamp = timestamp,
            subscriptionId = if (subscriptionId >= 0) subscriptionId else null
          )
          SmsStore.record(context, detection)
          if (settings.notifyOnAnalysisFailure) {
            NotificationHelper.showAnalysisFailure(context, detection)
          }
          SmsEventBus.emit(detection)
        }
      }
    }
  }
}

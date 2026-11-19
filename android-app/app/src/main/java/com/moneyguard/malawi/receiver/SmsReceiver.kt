package com.moneyguard.malawi.receiver

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Telephony
import android.util.Log
import androidx.core.content.ContextCompat
import com.moneyguard.malawi.MoneyGuardApplication
import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import com.moneyguard.malawi.notifications.DetectionNotificationHelper
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Receives ordinary carrier SMS broadcasts and classifies them on the device.
 * It never becomes the default SMS app, never uses SMS_DELIVER, and never
 * deletes, blocks or changes the original message.
 */
class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECEIVE_SMS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            Log.w(TAG, "SMS broadcast received without SMS permission; skipping analysis.")
            return
        }

        val application = context.applicationContext as? MoneyGuardApplication ?: return
        if (!application.container.protectionPreferences.isMonitoringEnabled()) return

        val pendingResult = goAsync()
        CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
            try {
                analyze(application, intent)
            } catch (error: Exception) {
                Log.e(TAG, "Could not analyse an incoming SMS broadcast.", error)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private suspend fun analyze(application: MoneyGuardApplication, intent: Intent) {
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val subscriptionId = intent.getIntExtra(EXTRA_SUBSCRIPTION, INVALID_SUBSCRIPTION)
        // SmsMessage.getMessageIndex()/getSequenceNumber() are hidden APIs, so
        // read the public PDU's concatenation header. Fall back to the platform
        // PDU order for single-part messages or unsupported PDU formats.
        val parts = messages.mapIndexed { index, message ->
            val sender = message.displayOriginatingAddress
                ?: message.originatingAddress
                ?: UNKNOWN_SENDER
            val sequence = message.pdu
                ?.let { SmsMessageProcessor.udhSequenceNumber(it) }
                ?.minus(1)
                ?: index
            SmsPart(
                sender = sender,
                body = message.messageBody.orEmpty(),
                timestampMillis = message.timestampMillis.takeIf { it > 0L }
                    ?: System.currentTimeMillis(),
                sequenceIndex = sequence,
                subscriptionId = subscriptionId
            )
        }

        val container = application.container
        // Do not record a message as analysed if the fitted model cannot load.
        val classifierLoad = container.classifierLoadResult
        val classifier = classifierLoad.classifier
        if (!classifierLoad.isReady || classifier == null) {
            Log.e(
                TAG,
                "Offline model unavailable (${classifierLoad.status.code}); skipping SMS analysis.",
                classifierLoad.error
            )
            return
        }

        val grouped = LinkedHashMap<Pair<String, Int>, MutableList<SmsPart>>()
        for (part in parts) {
            grouped.getOrPut(part.sender to part.subscriptionId) { mutableListOf() }.add(part)
        }

        for ((key, messageParts) in grouped) {
            val body = SmsMessageProcessor.assembleBody(messageParts)
            if (body.isEmpty()) continue

            val representative = messageParts.first()
            val fingerprint = SmsMessageProcessor.fingerprint(representative, body)
            if (!container.smsDeduplicationCache.claim(fingerprint)) {
                Log.d(TAG, "Duplicate SMS broadcast ignored.")
                continue
            }

            val timestamp = messageParts.minOf { it.timestampMillis }
            val record = try {
                val classification = classifier.classify(body)
                DetectionRecord(
                    id = UUID.randomUUID().toString(),
                    sender = key.first,
                    message = body,
                    classification = classification.classification,
                    confidence = classification.confidence.toFloat(),
                    timestampMillis = timestamp,
                    fraudProbability = classification.fraudProbability.toFloat(),
                    normalProbability = classification.normalProbability.toFloat(),
                    fingerprint = fingerprint
                )
            } catch (error: IllegalArgumentException) {
                Log.e(TAG, "Incoming SMS could not be classified.", error)
                DetectionRecord(
                    id = UUID.randomUUID().toString(),
                    sender = key.first,
                    message = body,
                    classification = DetectionClassification.NOT_ANALYSED,
                    confidence = null,
                    timestampMillis = timestamp,
                    fingerprint = fingerprint
                )
            }

            val stored = container.detectionRepository.recordDetectionOnce(record)

            if (stored && record.classification == DetectionClassification.FRAUDULENT) {
                DetectionNotificationHelper.showFraudAlert(application, record)
            }
        }
    }

    private companion object {
        const val TAG = "MoneyGuardSms"
        const val UNKNOWN_SENDER = "Unknown sender"
        const val EXTRA_SUBSCRIPTION = "subscription"
        const val INVALID_SUBSCRIPTION = -1
    }
}

package com.moneyguard.malawi.notifications

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.moneyguard.malawi.MainActivity
import com.moneyguard.malawi.R
import com.moneyguard.malawi.domain.model.DetectionRecord

internal data class FraudNotificationContent(
    val title: String,
    val sender: String,
    val preview: String,
    val instruction: String
)

private val notificationWhitespace = Regex("\\s+")

internal fun fraudNotificationContent(record: DetectionRecord): FraudNotificationContent {
    val readablePreview = record.message.replace(notificationWhitespace, " ").trim()
        .let { text ->
            if (text.length <= 180) text else "${text.take(177)}..."
        }
    return FraudNotificationContent(
        title = "FRAUD SMS DETECTED",
        sender = record.sender,
        preview = readablePreview,
        instruction = "Tap to view message details."
    )
}

object DetectionNotificationHelper {
    private const val CHANNEL_ID = "moneyguard_fraud_alerts"
    private const val CHANNEL_NAME = "Fraud alerts"
    private const val TAG = "MoneyGuardAlerts"

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Immediate warnings for incoming SMS classified as fraud."
            }
        )
    }

    fun areAlertsEnabled(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return false
        }
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(NotificationManager::class.java)
                ?: return false
            return manager.getNotificationChannel(CHANNEL_ID)?.importance
                ?.let { it != NotificationManager.IMPORTANCE_NONE } ?: false
        }
        return true
    }

    fun showFraudAlert(context: Context, record: DetectionRecord) {
        createChannel(context)
        if (!areAlertsEnabled(context)) {
            Log.w(
                TAG,
                "Fraud notification skipped because notification permission, app notifications, " +
                    "or the fraud-alert channel is disabled."
            )
            return
        }

        val content = fraudNotificationContent(record)
        val notificationId = record.id.hashCode()
        val openDetection = Intent(context, MainActivity::class.java).apply {
            putExtra(MainActivity.EXTRA_DETECTION_ID, record.id)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            openDetection,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val expandedText = buildString {
            append(content.sender)
            append('\n')
            append(content.preview)
            append("\n\n")
            append(content.instruction)
        }

        try {
            NotificationManagerCompat.from(context).notify(
                notificationId,
                NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setContentTitle(content.title)
                    .setContentText("${content.sender} · ${content.preview}")
                    .setStyle(
                        NotificationCompat.BigTextStyle()
                            .setBigContentTitle(content.title)
                            .bigText(expandedText)
                            .setSummaryText("MoneyGuard")
                    )
                    .setSubText("MoneyGuard")
                    .setColor(ContextCompat.getColor(context, R.color.mg_fraud_red))
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .build()
            )
        } catch (error: SecurityException) {
            Log.e(TAG, "Android rejected the fraud notification.", error)
        }
    }
}

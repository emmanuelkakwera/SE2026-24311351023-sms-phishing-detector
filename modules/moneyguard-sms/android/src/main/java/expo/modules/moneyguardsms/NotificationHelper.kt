package expo.modules.moneyguardsms

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import kotlin.math.roundToInt

object NotificationHelper {
  private const val FRAUD_CHANNEL_ID = "moneyguard_fraud_alerts"
  private const val FAILURE_CHANNEL_ID = "moneyguard_analysis_warnings"
  private const val ACCENT_COLOR = 0xFF176B4B.toInt()

  fun createChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return

    val fraudChannel = NotificationChannel(
      FRAUD_CHANNEL_ID,
      "Fraud alerts",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "High-priority alerts when an incoming SMS is classified as fraudulent."
      enableVibration(true)
      setShowBadge(true)
    }

    val failureChannel = NotificationChannel(
      FAILURE_CHANNEL_ID,
      "Analysis warnings",
      NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "Alerts when an incoming SMS could not be analysed."
      setShowBadge(true)
    }

    manager.createNotificationChannel(fraudChannel)
    manager.createNotificationChannel(failureChannel)
  }

  fun showFraudAlert(context: Context, detection: Detection) {
    val preview = preview(detection.body)
    val sender = detection.sender.ifBlank { "Unknown sender" }
    val confidence = detection.confidence?.let {
      "Model confidence: ${(it * 100).roundToInt()}%"
    } ?: "Confidence unavailable"
    val advice = "Do not share your PIN, send money, or follow instructions in the message. " +
      "Verify with your provider using its official app or USSD menu."
    val text = "$sender · $confidence\n$preview"

    post(
      context = context,
      channelId = FRAUD_CHANNEL_ID,
      notificationId = detection.id.hashCode(),
      title = "MoneyGuard: fraudulent SMS detected",
      text = text,
      bigText = "FRAUDULENT SMS DETECTED\n\n$sender\n$confidence\n\n\"$preview\"\n\n$advice\n\n" +
        "This is an automated risk classification, not proof.",
      detection = detection
    )
  }

  fun showAnalysisFailure(context: Context, detection: Detection) {
    val sender = detection.sender.ifBlank { "an unknown sender" }
    post(
      context = context,
      channelId = FAILURE_CHANNEL_ID,
      notificationId = detection.id.hashCode(),
      title = "MoneyGuard: SMS not analysed",
      text = "MoneyGuard could not check a message from $sender. Treat it with caution.",
      bigText = "MoneyGuard could not analyse an incoming message from $sender. " +
        "Treat it with caution and verify the sender independently.",
      detection = detection
    )
  }

  private fun preview(body: String): String {
    val clean = body.replace(Regex("\\s+"), " ").trim()
    return if (clean.length <= 140) clean else clean.take(139).trimEnd() + "…"
  }

  private fun post(
    context: Context,
    channelId: String,
    notificationId: Int,
    title: String,
    text: String,
    bigText: String,
    detection: Detection
  ) {
    createChannels(context)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return

    // Triple slash keeps `detection/<id>` as the Expo Router path instead of
    // interpreting "detection" as a URL host.
    val deepLink = Uri.parse("moneyguard:///detection/${detection.id}")
    val intent = Intent(Intent.ACTION_VIEW, deepLink).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val pendingIntent = PendingIntent.getActivity(
      context,
      notificationId,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(smallIcon(context))
      .setColor(ACCENT_COLOR)
      .setContentTitle(title)
      .setContentText(text)
      .setSubText("MoneyGuard Security")
      .setStyle(NotificationCompat.BigTextStyle().bigText(bigText))
      .setContentIntent(pendingIntent)
      .setAutoCancel(true)
      .setWhen(detection.timestamp)
      .setShowWhen(true)
      .setPriority(
        if (channelId == FRAUD_CHANNEL_ID) {
          NotificationCompat.PRIORITY_HIGH
        } else {
          NotificationCompat.PRIORITY_DEFAULT
        }
      )
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
      .build()

    runCatching {
      NotificationManagerCompat.from(context).notify(notificationId, notification)
    }
  }

  private fun smallIcon(context: Context): Int {
    val resourceId = context.resources.getIdentifier(
      "ic_moneyguard_notification",
      "drawable",
      context.packageName
    )
    return if (resourceId != 0) resourceId else android.R.drawable.ic_dialog_alert
  }
}

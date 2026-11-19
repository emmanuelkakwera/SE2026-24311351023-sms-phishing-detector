package expo.modules.moneyguardsms

import android.content.Context
import java.io.File
import java.security.MessageDigest
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject

data class NativeSettings(
  val monitoringEnabled: Boolean = true,
  val fraudAlertsEnabled: Boolean = true,
  val notifyOnAnalysisFailure: Boolean = true
)

data class Detection(
  val id: String,
  val sender: String,
  val body: String,
  val status: String,
  val confidence: Double?,
  val fraudProbability: Double?,
  val normalProbability: Double?,
  val explanation: String?,
  val signals: List<String>,
  val timestamp: Long,
  val subscriptionId: Int?,
  val detectedAt: Long = timestamp,
  val analysisSource: String = "ON_DEVICE"
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "sender" to sender,
    "body" to body,
    "status" to status,
    "confidence" to confidence,
    "fraudProbability" to fraudProbability,
    "normalProbability" to normalProbability,
    "explanation" to explanation,
    "signals" to signals,
    "timestamp" to timestamp,
    "subscriptionId" to subscriptionId,
    "detectedAt" to detectedAt,
    "analysisSource" to analysisSource
  )
}

/**
 * Private on-device storage for automatic SMS detections.
 *
 * Records never leave the phone. Fraudulent, legitimate and unanalysed results
 * are stored so the dashboard and history can report the real number of SMS
 * messages that were checked. Users can clear everything from Settings.
 */
object SmsStore {
  private const val SETTINGS_PREFS = "moneyguard_settings"
  private const val DEDUP_PREFS = "moneyguard_sms_dedup"
  private const val DETECTIONS_FILE = "moneyguard_detections.json"
  private const val MAX_RECORDS = 200
  private const val DEDUP_TTL_MS = 24L * 60L * 60L * 1000L
  private val lock = Any()

  fun settings(context: Context): NativeSettings {
    val prefs = context.getSharedPreferences(SETTINGS_PREFS, Context.MODE_PRIVATE)
    return NativeSettings(
      monitoringEnabled = prefs.getBoolean("monitoring_enabled", true),
      fraudAlertsEnabled = prefs.getBoolean("fraud_alerts_enabled", true),
      notifyOnAnalysisFailure = prefs.getBoolean("failure_alerts_enabled", true)
    )
  }

  fun setSettings(context: Context, settings: NativeSettings) {
    context.getSharedPreferences(SETTINGS_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean("monitoring_enabled", settings.monitoringEnabled)
      .putBoolean("fraud_alerts_enabled", settings.fraudAlertsEnabled)
      .putBoolean("failure_alerts_enabled", settings.notifyOnAnalysisFailure)
      .apply()
  }

  fun setMonitoringEnabled(context: Context, enabled: Boolean) {
    val current = settings(context)
    setSettings(context, current.copy(monitoringEnabled = enabled))
  }

  fun monitoringEnabled(context: Context): Boolean = settings(context).monitoringEnabled

  fun readDetections(context: Context): List<Detection> = synchronized(lock) {
    readDetectionsUnsafe(context)
  }

  fun findDetection(context: Context, id: String): Detection? =
    readDetections(context).firstOrNull { it.id == id }

  fun record(context: Context, detection: Detection): Detection = synchronized(lock) {
    val updated = (listOf(detection) + readDetectionsUnsafe(context).filterNot { it.id == detection.id })
      .sortedByDescending { it.timestamp }
      .take(MAX_RECORDS)
    writeDetectionsUnsafe(context, updated)
    detection
  }

  fun delete(context: Context, id: String) = synchronized(lock) {
    val remaining = readDetectionsUnsafe(context).filterNot { it.id == id }
    writeDetectionsUnsafe(context, remaining)
  }

  fun clear(context: Context) = synchronized(lock) {
    File(context.filesDir, DETECTIONS_FILE).delete()
  }

  fun deleteAllData(context: Context) {
    clear(context)
    context.getSharedPreferences(SETTINGS_PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    context.getSharedPreferences(DEDUP_PREFS, Context.MODE_PRIVATE).edit().clear().apply()
  }

  /**
   * Returns true when this sender/body/timestamp was already processed in the last 24 hours.
   * Duplicate deliveries are common with multipart SMS and multi-SIM devices.
   */
  fun isDuplicate(context: Context, sender: String, body: String, timestamp: Long): Boolean =
    synchronized(lock) {
      val prefs = context.getSharedPreferences(DEDUP_PREFS, Context.MODE_PRIVATE)
      val now = System.currentTimeMillis()
      val key = sha256("$sender|$body|$timestamp")
      val previous = prefs.getLong(key, 0L)
      if (previous > 0L && now - previous < DEDUP_TTL_MS) {
        return true
      }

      // Keep the dedup store bounded.
      val editor = prefs.edit()
      for ((storedKey, storedAt) in prefs.all) {
        if (storedAt is Long && now - storedAt >= DEDUP_TTL_MS) {
          editor.remove(storedKey)
        }
      }
      editor.putLong(key, now).apply()
      false
    }

  private fun readDetectionsUnsafe(context: Context): List<Detection> {
    val file = File(context.filesDir, DETECTIONS_FILE)
    if (!file.exists()) return emptyList()
    return runCatching {
      val array = JSONArray(file.readText())
      buildList {
        for (index in 0 until array.length()) {
          val item = array.getJSONObject(index)
          add(
            Detection(
              id = item.getString("id"),
              sender = item.optString("sender", "Unknown sender"),
              body = item.optString("body", ""),
              status = item.optString("status", "NOT_ANALYSED"),
              confidence = item.optNullableDouble("confidence"),
              fraudProbability = item.optNullableDouble("fraudProbability"),
              normalProbability = item.optNullableDouble("normalProbability"),
              explanation = item.optString("explanation").ifBlank { null },
              signals = item.optJSONArray("signals")?.let { signals ->
                buildList {
                  for (signalIndex in 0 until signals.length()) {
                    add(signals.optString(signalIndex))
                  }
                }
              } ?: emptyList(),
              timestamp = item.optLong("timestamp", 0L),
              subscriptionId = if (item.isNull("subscriptionId")) null else item.optInt("subscriptionId"),
              detectedAt = item.optLong("detectedAt", item.optLong("timestamp", 0L)),
              analysisSource = item.optString("analysisSource", "ON_DEVICE")
            )
          )
        }
      }
    }.getOrDefault(emptyList())
  }

  private fun writeDetectionsUnsafe(context: Context, items: List<Detection>) {
    val array = JSONArray()
    items.forEach { detection ->
      array.put(
        JSONObject().apply {
          put("id", detection.id)
          put("sender", detection.sender)
          put("body", detection.body)
          put("status", detection.status)
          put("confidence", detection.confidence ?: JSONObject.NULL)
          put("fraudProbability", detection.fraudProbability ?: JSONObject.NULL)
          put("normalProbability", detection.normalProbability ?: JSONObject.NULL)
          put("explanation", detection.explanation ?: JSONObject.NULL)
          put("signals", JSONArray(detection.signals))
          put("timestamp", detection.timestamp)
          put("subscriptionId", detection.subscriptionId ?: JSONObject.NULL)
          put("detectedAt", detection.detectedAt)
          put("analysisSource", detection.analysisSource)
        }
      )
    }
    runCatching { File(context.filesDir, DETECTIONS_FILE).writeText(array.toString()) }
  }

  fun newDetection(
    sender: String,
    body: String,
    status: String,
    confidence: Double?,
    fraudProbability: Double?,
    normalProbability: Double?,
    explanation: String?,
    signals: List<String>,
    timestamp: Long,
    subscriptionId: Int?
  ): Detection {
    return Detection(
      id = UUID.randomUUID().toString(),
      sender = sender.ifBlank { "Unknown sender" },
      body = body,
      status = status,
      confidence = confidence,
      fraudProbability = fraudProbability,
      normalProbability = normalProbability,
      explanation = explanation,
      signals = signals,
      timestamp = if (timestamp > 0L) timestamp else System.currentTimeMillis(),
      subscriptionId = subscriptionId,
      detectedAt = System.currentTimeMillis(),
      analysisSource = "ON_DEVICE"
    )
  }

  private fun JSONObject.optNullableDouble(key: String): Double? {
    if (isNull(key)) return null
    if (!has(key)) return null
    return optDouble(key).takeIf { !it.isNaN() }
  }

  private fun sha256(value: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }
  }
}

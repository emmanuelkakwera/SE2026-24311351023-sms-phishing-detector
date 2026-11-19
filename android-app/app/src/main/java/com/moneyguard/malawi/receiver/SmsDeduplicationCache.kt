package com.moneyguard.malawi.receiver

import android.content.Context
import org.json.JSONObject

/**
 * Remembers recently processed SMS fingerprints so a redelivered broadcast is
 * not classified, saved or notified twice. The cache persists across process
 * death and is bounded by both age and count.
 */
class SmsDeduplicationCache(context: Context) {

    private val preferences = context.applicationContext.getSharedPreferences(
        PREFERENCES_NAME,
        Context.MODE_PRIVATE
    )

    /**
     * Returns true when this fingerprint has not been processed recently and
     * records it. Call this once, immediately before classification.
     */
    @Synchronized
    fun claim(fingerprint: String, nowMillis: Long = System.currentTimeMillis()): Boolean {
        val stored = preferences.getString(KEY_RECENT, null)
        val recent = JSONObject(stored ?: "{}")
        val expired = mutableListOf<String>()

        val keys = recent.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            val seenAt = recent.optLong(key, 0L)
            if (nowMillis - seenAt > WINDOW_MILLIS || seenAt > nowMillis) {
                expired.add(key)
            }
        }
        expired.forEach { recent.remove(it) }

        if (recent.has(fingerprint)) return false

        recent.put(fingerprint, nowMillis)
        val ordered = recent.keys().asSequence()
            .sortedBy { recent.getLong(it) }
            .toList()
        if (ordered.size > MAX_ENTRIES) {
            ordered.take(ordered.size - MAX_ENTRIES).forEach { recent.remove(it) }
        }

        preferences.edit().putString(KEY_RECENT, recent.toString()).apply()
        return true
    }

    private companion object {
        const val PREFERENCES_NAME = "moneyguard_sms_dedup"
        const val KEY_RECENT = "recent_fingerprints"
        const val WINDOW_MILLIS = 10L * 60L * 1000L
        const val MAX_ENTRIES = 200
    }
}

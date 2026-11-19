package com.moneyguard.malawi.utils

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val detectionFormatter = DateTimeFormatter.ofPattern(
    "d MMM yyyy, HH:mm",
    Locale.getDefault()
)

/**
 * Formats a stored epoch timestamp for history and detail screens.
 */
fun formatDetectionTimestamp(timestampMillis: Long): String {
    if (timestampMillis <= 0L) return "—"
    return Instant.ofEpochMilli(timestampMillis)
        .atZone(ZoneId.systemDefault())
        .format(detectionFormatter)
}

fun formatConfidence(confidence: Float?): String {
    val value = confidence ?: return "—"
    return String.format(Locale.getDefault(), "%.2f%%", value * 100f)
}

/**
 * A small, deterministic greeting used by the dashboard.
 */
fun greetingForHour(hour: Int): String = when {
    hour < 12 -> "Good morning"
    hour < 17 -> "Good afternoon"
    else -> "Good evening"
}

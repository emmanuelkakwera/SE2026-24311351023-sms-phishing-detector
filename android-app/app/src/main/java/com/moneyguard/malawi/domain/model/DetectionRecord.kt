package com.moneyguard.malawi.domain.model

/**
 * A single SMS detection result.
 *
 * [timestampMillis] is stored as epoch milliseconds so a Room entity can map
 * to it directly when local persistence is added.
 */
data class DetectionRecord(
    val id: String,
    val sender: String,
    val message: String,
    val classification: DetectionClassification,
    val confidence: Float?,
    val timestampMillis: Long,
    val safetyAdvice: String? = null,
    val fraudProbability: Float? = null,
    val normalProbability: Float? = null,
    val fingerprint: String? = null
) {
    val preview: String
        get() = message.replace(Regex("\\s+"), " ").trim()
}

package com.moneyguard.malawi.data.local

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import com.moneyguard.malawi.receiver.SmsMessageProcessor

@Entity(
    tableName = "detections",
    indices = [Index(value = ["fingerprint"])]
)
data class DetectionEntity(
    @PrimaryKey val id: String,
    // Added in database version 2. Existing rows keep the empty default.
    @ColumnInfo(defaultValue = "") val fingerprint: String = "",
    val sender: String,
    val message: String,
    val classification: String,
    val confidence: Double?,
    val fraudProbability: Double?,
    val normalProbability: Double?,
    val timestampMillis: Long
) {
    fun toDomain(): DetectionRecord = DetectionRecord(
        id = id,
        sender = sender,
        message = message,
        classification = DetectionClassification.valueOf(classification),
        confidence = confidence?.toFloat(),
        timestampMillis = timestampMillis,
        fraudProbability = fraudProbability?.toFloat(),
        normalProbability = normalProbability?.toFloat(),
        fingerprint = fingerprint
    )

    companion object {
        fun fromDomain(record: DetectionRecord): DetectionEntity = DetectionEntity(
            id = record.id,
            sender = record.sender,
            message = record.message,
            classification = record.classification.name,
            confidence = record.confidence?.toDouble(),
            fraudProbability = record.fraudProbability?.toDouble(),
            normalProbability = record.normalProbability?.toDouble(),
            timestampMillis = record.timestampMillis,
            fingerprint = record.fingerprint?.takeIf { it.isNotEmpty() }
                ?: SmsMessageProcessor.fingerprint(
                    sender = record.sender,
                    subscriptionId = -1,
                    timestampMillis = record.timestampMillis,
                    assembledBody = record.message
                )
        )
    }
}

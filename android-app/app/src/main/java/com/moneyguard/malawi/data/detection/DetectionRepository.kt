package com.moneyguard.malawi.data.detection

import com.moneyguard.malawi.domain.model.DetectionRecord
import kotlinx.coroutines.flow.Flow

/** Read and write contract for locally stored detection history. */
interface DetectionRepository {
    fun observeDetections(): Flow<List<DetectionRecord>>
    suspend fun getDetection(id: String): DetectionRecord?
    suspend fun recordDetection(record: DetectionRecord)

    /**
     * Stores a record only if this exact incoming SMS has not been stored yet.
     * Returns true when a new record was written.
     */
    suspend fun recordDetectionOnce(record: DetectionRecord): Boolean
    suspend fun clearHistory()
}

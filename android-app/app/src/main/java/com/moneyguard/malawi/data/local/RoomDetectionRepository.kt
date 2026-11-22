package com.moneyguard.malawi.data.local

import com.moneyguard.malawi.data.detection.DetectionRepository
import com.moneyguard.malawi.domain.model.DetectionRecord
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class RoomDetectionRepository(
    private val dao: DetectionDao
) : DetectionRepository {
    override fun observeDetections(): Flow<List<DetectionRecord>> =
        dao.observeAll().map { detections -> detections.map(DetectionEntity::toDomain) }

    override suspend fun getDetection(id: String): DetectionRecord? =
        dao.findById(id)?.toDomain()

    override suspend fun recordDetection(record: DetectionRecord) {
        dao.insert(DetectionEntity.fromDomain(record))
    }

    override suspend fun recordDetectionOnce(record: DetectionRecord): Boolean =
        dao.insertIfNew(DetectionEntity.fromDomain(record))

    override suspend fun deleteDetection(id: String) {
        dao.deleteById(id)
    }

    override suspend fun deleteOlderThan(cutoffTimestampMillis: Long): Int =
        dao.deleteOlderThan(cutoffTimestampMillis)

    override suspend fun clearHistory() {
        dao.clearAll()
    }
}

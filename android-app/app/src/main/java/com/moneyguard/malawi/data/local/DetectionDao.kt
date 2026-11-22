package com.moneyguard.malawi.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface DetectionDao {
    @Query("SELECT * FROM detections ORDER BY timestampMillis DESC")
    fun observeAll(): Flow<List<DetectionEntity>>

    @Query("SELECT * FROM detections WHERE id = :id LIMIT 1")
    suspend fun findById(id: String): DetectionEntity?

    @Query("SELECT COUNT(*) > 0 FROM detections WHERE fingerprint = :fingerprint")
    suspend fun existsByFingerprint(fingerprint: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(detection: DetectionEntity)

    /**
     * Atomically stores a detection only when the same incoming SMS has not
     * already been recorded. This protects against repeated SMS_RECEIVED
     * broadcasts, including after the process is restarted.
     */
    @Transaction
    suspend fun insertIfNew(detection: DetectionEntity): Boolean {
        if (detection.fingerprint.isEmpty() || !existsByFingerprint(detection.fingerprint)) {
            insert(detection)
            return true
        }
        return false
    }

    @Query("DELETE FROM detections WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM detections WHERE timestampMillis < :cutoffTimestampMillis")
    suspend fun deleteOlderThan(cutoffTimestampMillis: Long): Int

    @Query("DELETE FROM detections")
    suspend fun clearAll()
}

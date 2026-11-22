package com.moneyguard.malawi.ui.viewmodel

import com.moneyguard.malawi.data.detection.DetectionRepository
import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test

class HistoryViewModelRetentionTest {

    @Test
    fun repositoryDeleteByIdRemovesSingleRecord() = runBlocking {
        val repo = FakeDetectionRepository(
            listOf(
                sampleRecord("keep-1", 2_000L),
                sampleRecord("remove-1", 1_000L)
            )
        )

        repo.deleteDetection("remove-1")

        assertEquals(listOf("keep-1"), repo.currentRecords().map { it.id })
    }

    @Test
    fun repositoryDeleteOlderThanRemovesExpiredRecordsOnly() = runBlocking {
        val repo = FakeDetectionRepository(
            listOf(
                sampleRecord("expired-1", 500L),
                sampleRecord("boundary-cutoff", 1_000L),
                sampleRecord("recent-1", 1_500L)
            )
        )

        val deletedCount = repo.deleteOlderThan(1_000L)

        assertEquals(1, deletedCount)
        assertEquals(
            listOf("boundary-cutoff", "recent-1"),
            repo.currentRecords().map { it.id }
        )
    }

    private fun sampleRecord(id: String, timestampMillis: Long) = DetectionRecord(
        id = id,
        sender = "Airtel Money",
        message = "Test alert",
        classification = DetectionClassification.LEGITIMATE,
        confidence = 0.8f,
        timestampMillis = timestampMillis
    )

    private class FakeDetectionRepository(
        initial: List<DetectionRecord>
    ) : DetectionRepository {
        private val state = MutableStateFlow(initial)

        fun currentRecords(): List<DetectionRecord> = state.value

        override fun observeDetections(): Flow<List<DetectionRecord>> = state

        override suspend fun getDetection(id: String): DetectionRecord? =
            state.value.firstOrNull { it.id == id }

        override suspend fun recordDetection(record: DetectionRecord) {
            state.update { it + record }
        }

        override suspend fun recordDetectionOnce(record: DetectionRecord): Boolean {
            if (state.value.any { it.id == record.id }) return false
            state.update { it + record }
            return true
        }

        override suspend fun deleteDetection(id: String) {
            state.update { items -> items.filterNot { it.id == id } }
        }

        override suspend fun deleteOlderThan(cutoffTimestampMillis: Long): Int {
            val before = state.value.size
            state.update { items -> items.filterNot { it.timestampMillis < cutoffTimestampMillis } }
            return before - state.value.size
        }

        override suspend fun clearHistory() {
            state.value = emptyList()
        }
    }
}

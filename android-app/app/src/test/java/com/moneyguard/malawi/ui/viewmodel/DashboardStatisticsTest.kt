package com.moneyguard.malawi.ui.viewmodel

import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import org.junit.Assert.assertEquals
import org.junit.Test

class DashboardStatisticsTest {

    @Test
    fun statisticsAreDerivedOnlyFromAnalysedStoredRecords() {
        val records = listOf(
            record("f1", DetectionClassification.FRAUDULENT, 100L),
            record("n1", DetectionClassification.LEGITIMATE, 300L),
            record("f2", DetectionClassification.FRAUDULENT, 200L),
            record("x1", DetectionClassification.NOT_ANALYSED, 400L)
        )

        val summary = summarizeDetectionRecords(records)

        assertEquals(3, summary.totalAnalysed)
        assertEquals(2, summary.fraudulentDetected)
        assertEquals(1, summary.legitimateDetected)
        assertEquals(listOf("x1", "n1", "f2"), summary.recentDetections.map { it.id })
    }

    @Test
    fun emptyHistoryProducesZeroStatistics() {
        val summary = summarizeDetectionRecords(emptyList())
        assertEquals(0, summary.totalAnalysed)
        assertEquals(0, summary.fraudulentDetected)
        assertEquals(0, summary.legitimateDetected)
        assertEquals(emptyList<String>(), summary.recentDetections.map { it.id })
    }

    private fun record(
        id: String,
        classification: DetectionClassification,
        timestampMillis: Long
    ) = DetectionRecord(
        id = id,
        sender = "0999000000",
        message = "Test SMS $id",
        classification = classification,
        confidence = 0.9f,
        timestampMillis = timestampMillis
    )
}

package com.moneyguard.malawi.data.local

import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DetectionEntityMappingTest {

    @Test
    fun storedFingerprintSurvivesDomainAndEntityMapping() {
        val record = record().copy(fingerprint = "known-fingerprint")

        val entity = DetectionEntity.fromDomain(record)
        val restored = entity.toDomain()

        assertEquals("known-fingerprint", entity.fingerprint)
        assertEquals("known-fingerprint", restored.fingerprint)
        assertEquals(record.classification, restored.classification)
        assertEquals(record.timestampMillis, restored.timestampMillis)
        assertEquals(record.sender, restored.sender)
        assertEquals(record.message, restored.message)
    }

    @Test
    fun missingFingerprintGetsAStableFallback() {
        val record = record()

        val first = DetectionEntity.fromDomain(record)
        val second = DetectionEntity.fromDomain(record.copy())

        assertTrue(first.fingerprint.isNotBlank())
        assertEquals(first.fingerprint, second.fingerprint)
    }

    private fun record() = DetectionRecord(
        id = "detection-1",
        sender = "Airtel Money",
        message = "Your balance is MK 1000.",
        classification = DetectionClassification.LEGITIMATE,
        confidence = 0.75f,
        timestampMillis = 1_700_000_000_000L
    )
}

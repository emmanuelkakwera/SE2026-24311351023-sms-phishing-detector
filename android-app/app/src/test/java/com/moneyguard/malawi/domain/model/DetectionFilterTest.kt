package com.moneyguard.malawi.domain.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DetectionFilterTest {

    private val fraudulent = record("1", DetectionClassification.FRAUDULENT)
    private val normal = record("2", DetectionClassification.LEGITIMATE)
    private val unknown = record("3", DetectionClassification.NOT_ANALYSED)

    @Test
    fun `all filter keeps every classification`() {
        assertTrue(DetectionFilter.ALL.matches(fraudulent))
        assertTrue(DetectionFilter.ALL.matches(normal))
        assertTrue(DetectionFilter.ALL.matches(unknown))
    }

    @Test
    fun `fraudulent filter only keeps fraud records`() {
        assertTrue(DetectionFilter.FRAUDULENT.matches(fraudulent))
        assertFalse(DetectionFilter.FRAUDULENT.matches(normal))
        assertFalse(DetectionFilter.FRAUDULENT.matches(unknown))
    }

    @Test
    fun `normal filter only keeps legitimate records`() {
        assertFalse(DetectionFilter.NORMAL.matches(fraudulent))
        assertTrue(DetectionFilter.NORMAL.matches(normal))
        assertFalse(DetectionFilter.NORMAL.matches(unknown))
    }

    @Test
    fun `preview collapses repeated whitespace`() {
        val record = record("4", DetectionClassification.FRAUDULENT)
            .copy(message = "  Hello   world \n from MoneyGuard ")
        assertEquals("Hello world from MoneyGuard", record.preview)
    }

    private fun record(id: String, classification: DetectionClassification) =
        DetectionRecord(
            id = id,
            sender = "Test",
            message = "Message",
            classification = classification,
            confidence = 0.9f,
            timestampMillis = 1_700_000_000_000L
        )
}

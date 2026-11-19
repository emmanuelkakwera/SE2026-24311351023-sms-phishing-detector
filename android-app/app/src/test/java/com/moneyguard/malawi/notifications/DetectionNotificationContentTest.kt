package com.moneyguard.malawi.notifications

import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionRecord
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DetectionNotificationContentTest {

    @Test
    fun `fraud notification content is direct and contains no confidence value`() {
        val record = DetectionRecord(
            id = "detection-1",
            sender = "+265 999 XXX XXX",
            message = "Congratulations!   Mwalandila MK200,000,000.\nNdiyimbileni kuti mulandire ndalama zanu...",
            classification = DetectionClassification.FRAUDULENT,
            confidence = 0.9321f,
            timestampMillis = 1L
        )

        val content = fraudNotificationContent(record)

        assertEquals("FRAUD SMS DETECTED", content.title)
        assertEquals("+265 999 XXX XXX", content.sender)
        assertEquals(
            "Congratulations! Mwalandila MK200,000,000. Ndiyimbileni kuti mulandire ndalama zanu...",
            content.preview
        )
        assertEquals("Tap to view message details.", content.instruction)
        assertFalse(content.toString().contains("93.21"))
    }

    @Test
    fun `long message preview is readable and bounded`() {
        val record = DetectionRecord(
            id = "detection-2",
            sender = "Unknown sender",
            message = "A".repeat(400),
            classification = DetectionClassification.FRAUDULENT,
            confidence = 0.99f,
            timestampMillis = 1L
        )

        val content = fraudNotificationContent(record)

        assertTrue(content.preview.length <= 180)
        assertTrue(content.preview.endsWith("..."))
    }
}

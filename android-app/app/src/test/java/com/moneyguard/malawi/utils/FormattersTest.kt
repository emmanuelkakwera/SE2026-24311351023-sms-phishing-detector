package com.moneyguard.malawi.utils

import org.junit.Assert.assertEquals
import org.junit.Test

class FormattersTest {

    @Test
    fun `greeting changes by time of day`() {
        assertEquals("Good morning", greetingForHour(6))
        assertEquals("Good afternoon", greetingForHour(13))
        assertEquals("Good evening", greetingForHour(20))
    }

    @Test
    fun `missing timestamp shows a dash instead of a fake date`() {
        assertEquals("—", formatDetectionTimestamp(0L))
        assertEquals("—", formatDetectionTimestamp(-1L))
    }

    @Test
    fun `confidence is formatted as a percentage`() {
        assertEquals("91.50%", formatConfidence(0.915f))
        assertEquals("—", formatConfidence(null))
    }
}

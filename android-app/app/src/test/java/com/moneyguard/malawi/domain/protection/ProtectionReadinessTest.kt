package com.moneyguard.malawi.domain.protection

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ProtectionReadinessTest {

    @Test
    fun enablesOnlyWhenEveryComponentIsOperational() {
        val readiness = evaluateProtectionReadiness(
            smsPermissionGranted = true,
            notificationPermissionGranted = true,
            modelReady = true,
            receiverConfigured = true
        )
        assertTrue(readiness.canEnable)
        assertTrue(readiness.blockers.isEmpty())
    }

    @Test
    fun permissionDeniedBlocksProtection() {
        val readiness = evaluateProtectionReadiness(
            smsPermissionGranted = false,
            notificationPermissionGranted = true,
            modelReady = true,
            receiverConfigured = true
        )
        assertFalse(readiness.canEnable)
        assertEquals(listOf(ProtectionBlocker.SMS_PERMISSION), readiness.blockers)
        assertTrue(readiness.explanation.contains("SMS permission"))
    }

    @Test
    fun notificationPermissionDeniedBlocksProtection() {
        val readiness = evaluateProtectionReadiness(
            smsPermissionGranted = true,
            notificationPermissionGranted = false,
            modelReady = true,
            receiverConfigured = true
        )
        assertFalse(readiness.canEnable)
        assertEquals(listOf(ProtectionBlocker.NOTIFICATION_PERMISSION), readiness.blockers)
    }

    @Test
    fun modelUnavailableBlocksProtection() {
        val readiness = evaluateProtectionReadiness(
            smsPermissionGranted = true,
            notificationPermissionGranted = true,
            modelReady = false,
            receiverConfigured = true
        )
        assertFalse(readiness.canEnable)
        assertEquals(listOf(ProtectionBlocker.MODEL_UNAVAILABLE), readiness.blockers)
        assertTrue(readiness.explanation.contains("model"))
    }

    @Test
    fun receiverNotConfiguredBlocksProtection() {
        val readiness = evaluateProtectionReadiness(
            smsPermissionGranted = true,
            notificationPermissionGranted = true,
            modelReady = true,
            receiverConfigured = false
        )
        assertFalse(readiness.canEnable)
        assertEquals(listOf(ProtectionBlocker.RECEIVER_NOT_CONFIGURED), readiness.blockers)
    }

    @Test
    fun allMissingComponentsAreReportedTogether() {
        val readiness = evaluateProtectionReadiness(false, false, false, false)
        assertFalse(readiness.canEnable)
        assertEquals(ProtectionBlocker.entries.toSet(), readiness.blockers.toSet())
    }
}

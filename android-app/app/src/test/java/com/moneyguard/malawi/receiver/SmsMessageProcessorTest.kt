package com.moneyguard.malawi.receiver

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class SmsMessageProcessorTest {

    @Test
    fun multipartPartsAreJoinedInCarrierOrder() {
        val parts = listOf(
            part(sequenceIndex = 2, body = "complete disbursement."),
            part(sequenceIndex = 0, body = "Your Airtel Money loan "),
            part(sequenceIndex = 1, body = "was approved. ")
        )
        assertEquals(
            "Your Airtel Money loan was approved. complete disbursement.",
            SmsMessageProcessor.assembleBody(parts)
        )
    }

    @Test
    fun whitespaceAroundAnSmsIsTrimmed() {
        val parts = listOf(part(body = "  Zikomo   "))
        assertEquals("Zikomo", SmsMessageProcessor.assembleBody(parts))
    }

    @Test
    fun fingerprintIsStableForTheSameIncomingMessage() {
        val part = part()
        val body = SmsMessageProcessor.assembleBody(listOf(part))
        assertEquals(
            SmsMessageProcessor.fingerprint(part, body),
            SmsMessageProcessor.fingerprint(part.copy(), body)
        )
    }

    @Test
    fun fingerprintDistinguishesDifferentMessages() {
        val part = part()
        val first = SmsMessageProcessor.fingerprint(part, "message one")
        val differentText = SmsMessageProcessor.fingerprint(part, "message two")
        val differentSender = SmsMessageProcessor.fingerprint(
            part.copy(sender = "0999000000"), "message one"
        )
        val differentTime = SmsMessageProcessor.fingerprint(
            part.copy(timestampMillis = 1235L), "message one"
        )
        assertNotEquals(first, differentText)
        assertNotEquals(first, differentSender)
        assertNotEquals(first, differentTime)
    }

    @Test
    fun emptyPartBodiesProduceEmptyAssembledBody() {
        assertEquals(
            "",
            SmsMessageProcessor.assembleBody(
                listOf(part(body = ""), part(body = "   "), part(body = "\n"))
            )
        )
    }

    @Test
    fun duplicateSequenceIndicesUseStableBodyTieBreaker() {
        val parts = listOf(
            part(sequenceIndex = 0, body = "bbb"),
            part(sequenceIndex = 0, body = "aaa")
        )
        assertEquals("aaabbb", SmsMessageProcessor.assembleBody(parts))
    }

    @Test
    fun fingerprintDistinguishesSubscriptionIds() {
        val first = SmsMessageProcessor.fingerprint(part(subscriptionId = 1), "message")
        val second = SmsMessageProcessor.fingerprint(part(subscriptionId = 2), "message")
        assertNotEquals(first, second)
    }

    @Test
    fun readsConcatenatedSequenceFromPublicPduHeader() {
        // Minimal 3GPP deliver PDU: no SMSC, TP-UDHI set, 8-bit concatenation IE
        // with reference 0x2A, total parts 2 and sequence number 1.
        val pdu = byteArrayOf(
            0x00,
            0x44,
            0x01, 0x91.toByte(), 0x21,
            0x00,
            0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x05,
            0x05,
            0x00, 0x03, 0x2A, 0x02, 0x01,
            0x48, 0x65, 0x6C, 0x6C, 0x6F
        )
        assertEquals(1, SmsMessageProcessor.udhSequenceNumber(pdu))
    }

    @Test
    fun singlePartPduHasNoConcatenationHeader() {
        val pdu = byteArrayOf(
            0x00, 0x04, 0x01, 0x91.toByte(), 0x21, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F
        )
        assertEquals(null, SmsMessageProcessor.udhSequenceNumber(pdu))
    }

    @Test
    fun malformedPdusReturnNoSequenceInsteadOfThrowing() {
        listOf(
            byteArrayOf(),
            byteArrayOf(0x00, 0x44, 0x01),
            byteArrayOf(
                0x00, 0x44, 0x01, 0x91.toByte(), 0x21, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05,
                0x7F, 0x00, 0x03, 0x2A, 0x02, 0x01
            )
        ).forEach { pdu ->
            assertEquals(null, SmsMessageProcessor.udhSequenceNumber(pdu))
        }
    }

    private fun part(
        sender: String = "Airtel",
        body: String = "body",
        timestampMillis: Long = 1234L,
        sequenceIndex: Int = 0,
        subscriptionId: Int = 1
    ) = SmsPart(sender, body, timestampMillis, sequenceIndex, subscriptionId)
}

package com.moneyguard.malawi.receiver

import java.security.MessageDigest

/**
 * The parts of an incoming SMS that are needed to assemble and identify it.
 * Kept independent of Android's SmsMessage so the logic can be unit tested.
 */
data class SmsPart(
    val sender: String,
    val body: String,
    val timestampMillis: Long,
    val sequenceIndex: Int,
    val subscriptionId: Int
)

object SmsMessageProcessor {

    /**
     * Reassembles a multipart SMS in the order indicated by the carrier. The
     * sequence index is taken from SmsMessage.messageIndex (falling back to
     * sequenceNumber) by the receiver. A stable tie-breaker keeps ordering
     * deterministic if a carrier sends duplicate indices.
     */
    fun assembleBody(parts: List<SmsPart>): String = parts
        .sortedWith(compareBy<SmsPart> { it.sequenceIndex }.thenBy { it.body })
        .joinToString(separator = "") { it.body }
        .trim()

    /**
     * Reads the 1-based part number from the concatenated-SMS User Data Header
     * of a 3GPP PDU. Returns null for single-part messages or formats that do
     * not expose a UDH, in which case callers should keep the platform order.
     */
    fun udhSequenceNumber(pdu: ByteArray): Int? {
        if (pdu.size < 10) return null
        var index = 0
        val smscLength = pdu[index++].toInt() and 0xFF
        index += smscLength
        if (index + 3 > pdu.size) return null

        val firstOctet = pdu[index++].toInt() and 0xFF
        if (firstOctet and 0x40 == 0) return null // TP-UDHI flag not set

        val originatorLength = pdu[index++].toInt() and 0xFF
        index++ // type of address
        index += (originatorLength + 1) / 2 // address digits (semi-octets)
        index++ // TP-PID
        index++ // TP-DCS
        index += 7 // TP-SCTS
        index++ // TP-UDL
        if (index >= pdu.size) return null

        val headerLength = pdu[index++].toInt() and 0xFF
        // A UDH that claims more bytes than the PDU actually contains is
        // malformed. Truncating it to the PDU length could expose unrelated
        // message bytes as a fake concatenation sequence, so reject it.
        if (index + headerLength > pdu.size) return null
        val headerEnd = index + headerLength
        while (index + 1 < headerEnd) {
            val elementId = pdu[index++].toInt() and 0xFF
            val elementLength = pdu[index++].toInt() and 0xFF
            if (elementLength <= 0 || index + elementLength > headerEnd) return null
            val isConcatenated = (elementId == 0x00 && elementLength == 3) ||
                (elementId == 0x08 && elementLength == 4)
            if (isConcatenated) {
                return pdu[index + elementLength - 1].toInt() and 0xFF
            }
            index += elementLength
        }
        return null
    }

    /**
     * A stable fingerprint for one incoming carrier message. The carrier
     * timestamp is part of the key so two different messages with the same
     * text are not collapsed, while a redelivered broadcast of one message
     * (same sender, text and timestamp) is processed only once.
     */
    fun fingerprint(part: SmsPart, assembledBody: String = part.body): String = fingerprint(
        sender = part.sender,
        subscriptionId = part.subscriptionId,
        timestampMillis = part.timestampMillis,
        assembledBody = assembledBody
    )

    /** Fingerprint helper that can also be used when storing a detection record. */
    fun fingerprint(
        sender: String,
        subscriptionId: Int,
        timestampMillis: Long,
        assembledBody: String
    ): String {
        val input = listOf(
            subscriptionId.toString(),
            sender,
            timestampMillis.toString(),
            assembledBody
        ).joinToString(separator = "\u001f")
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray(Charsets.UTF_8))
        return digest.joinToString(separator = "") { "%02x".format(it) }
    }
}

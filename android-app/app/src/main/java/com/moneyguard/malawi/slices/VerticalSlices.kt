package com.moneyguard.malawi.slices

import com.moneyguard.malawi.data.classifier.OfflineSmsClassifier
import com.moneyguard.malawi.domain.model.DetectionClassification
import java.security.MessageDigest

data class WarningDecision(
    val warn: Boolean,
    val score: Double,
    val source: String,
    val reason: String
)

fun interface DetectionStrategy {
    fun evaluate(message: String): WarningDecision?
}

class MalawiFraudRuleStrategy(
    private val highRiskPhrases: List<String> = listOf(
        "tumiza ndalama", "pin yanu", "mpamba", "airtel money",
        "send money", "verify pin", "won k", "claim prize"
    )
) : DetectionStrategy {
    override fun evaluate(message: String): WarningDecision? {
        val normalized = message.lowercase()
        val matched = highRiskPhrases.firstOrNull { normalized.contains(it) } ?: return null
        return WarningDecision(
            warn = true,
            score = 0.95,
            source = "rule-strategy",
            reason = "Matched high-risk phrase: $matched"
        )
    }
}

class ClassifierScoreStrategy(
    private val classifier: OfflineSmsClassifier,
    private val threshold: Double = 0.50
) : DetectionStrategy {
    override fun evaluate(message: String): WarningDecision {
        val result = classifier.classify(message)
        val shouldWarn = result.classification == DetectionClassification.FRAUDULENT &&
            result.fraudProbability >= threshold
        return WarningDecision(
            warn = shouldWarn,
            score = result.fraudProbability,
            source = "ml-strategy",
            reason = if (shouldWarn) "Model fraud probability above threshold" else "Below fraud threshold"
        )
    }
}

class SmsWarningChain(
    private val stages: List<DetectionStrategy>
) {
    fun runVs1(message: String): WarningDecision {
        require(message.isNotBlank()) { "Incoming SMS must not be blank." }
        for (stage in stages) {
            val hit = stage.evaluate(message)
            if (hit != null && hit.warn) return hit
        }
        return stages.last().evaluate(message) ?: WarningDecision(
            warn = false,
            score = 0.0,
            source = "fallback",
            reason = "No warning triggered"
        )
    }
}

data class QueuedUserReport(
    val reportId: String,
    val sender: String,
    val messageBody: String,
    val userConsented: Boolean,
    val submittedAtMillis: Long
)

class ReportReviewQueue {
    private val queue = mutableListOf<QueuedUserReport>()

    fun submitUserReport(
        reportId: String,
        sender: String,
        messageBody: String,
        userConsented: Boolean,
        submittedAtMillis: Long
    ): Boolean {
        if (!userConsented || messageBody.isBlank()) return false
        queue.add(
            QueuedUserReport(
                reportId = reportId,
                sender = sender,
                messageBody = messageBody.trim(),
                userConsented = true,
                submittedAtMillis = submittedAtMillis
            )
        )
        return true
    }

    fun pendingReports(): List<QueuedUserReport> = queue.toList()
}

interface UpdateVerifier {
    fun applyUpdate(payload: String, signatureHex: String): Boolean
}

class DeviceUpdateApplier {
    private val appliedPayloads = mutableListOf<String>()
    fun apply(payload: String) {
        appliedPayloads.add(payload)
    }
    fun appliedCount(): Int = appliedPayloads.size
}

class SignedUpdateProxy(
    private val target: DeviceUpdateApplier,
    private val signingSecret: String
) : UpdateVerifier {
    override fun applyUpdate(payload: String, signatureHex: String): Boolean {
        val expected = sign(payload, signingSecret)
        if (!MessageDigest.isEqual(
                expected.toByteArray(Charsets.UTF_8),
                signatureHex.lowercase().toByteArray(Charsets.UTF_8)
            )
        ) {
            return false
        }
        target.apply(payload)
        return true
    }

    fun sign(payload: String, secret: String = signingSecret): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest("$secret::$payload".toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }
}

data class SliceRunSummary(
    val vs1WarningTriggered: Boolean,
    val vs2ReportQueued: Boolean,
    val vs3SignedApplied: Boolean,
    val vs3TamperedRejected: Boolean
) {
    val allPassed: Boolean
        get() = vs1WarningTriggered && vs2ReportQueued && vs3SignedApplied && vs3TamperedRejected
}

object SliceRunner {
    fun runAllSlices(classifier: OfflineSmsClassifier): SliceRunSummary {
        val chain = SmsWarningChain(
            listOf(
                MalawiFraudRuleStrategy(),
                ClassifierScoreStrategy(classifier)
            )
        )
        val vs1 = chain.runVs1("Tumiza ndalama tsopano pa nambala iyi kuti mutsimikize PIN yanu")

        val queue = ReportReviewQueue()
        val vs2 = queue.submitUserReport(
            reportId = "rep-vs2-001",
            sender = "+265990000111",
            messageBody = "Tumiza ndalama tsopano pa nambala iyi",
            userConsented = true,
            submittedAtMillis = 1763800000000L
        )

        val applier = DeviceUpdateApplier()
        val proxy = SignedUpdateProxy(applier, "EK23-WKBD-MF26-KEY")
        val payload = "rules-v1:chichewa-pin-scam"
        val validSig = proxy.sign(payload)
        val vs3Signed = proxy.applyUpdate(payload, validSig)
        val vs3Tampered = !proxy.applyUpdate(payload + ":tampered", validSig)

        return SliceRunSummary(
            vs1WarningTriggered = vs1.warn,
            vs2ReportQueued = vs2 && queue.pendingReports().size == 1,
            vs3SignedApplied = vs3Signed && applier.appliedCount() == 1,
            vs3TamperedRejected = vs3Tampered && applier.appliedCount() == 1
        )
    }
}

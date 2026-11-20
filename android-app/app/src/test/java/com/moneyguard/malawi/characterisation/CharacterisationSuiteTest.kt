package com.moneyguard.malawi.characterisation

import com.moneyguard.malawi.data.classifier.ClassifierLoadStatus
import com.moneyguard.malawi.data.classifier.OfflineModelLoader
import com.moneyguard.malawi.data.classifier.OfflineSmsClassifier
import com.moneyguard.malawi.data.local.DetectionEntity
import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.model.DetectionFilter
import com.moneyguard.malawi.domain.model.DetectionRecord
import com.moneyguard.malawi.domain.protection.ProtectionBlocker
import com.moneyguard.malawi.domain.protection.evaluateProtectionReadiness
import com.moneyguard.malawi.notifications.fraudNotificationContent
import com.moneyguard.malawi.receiver.SmsMessageProcessor
import com.moneyguard.malawi.receiver.SmsPart
import com.moneyguard.malawi.ui.viewmodel.summarizeDetectionRecords
import com.moneyguard.malawi.utils.formatConfidence
import com.moneyguard.malawi.utils.formatDetectionTimestamp
import com.moneyguard.malawi.utils.greetingForHour
import java.io.File
import java.util.regex.Pattern
import kotlin.math.abs
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class CharacterisationSuiteTest {

    private val modelJsonText: String by lazy {
        File("../../assets/model/moneyguard_model.json").readText(Charsets.UTF_8)
    }

    private val classifier: OfflineSmsClassifier by lazy {
        OfflineSmsClassifier.fromJson(JSONObject(modelJsonText))
    }

    @Test
    fun char01_classifierTrimsSurroundingWhitespaceBeforeScoring() {
        val plain = classifier.classify("Airtel Money balance is MK 5,000.")
        val padded = classifier.classify("  \n\tAirtel Money balance is MK 5,000.\r\n  ")
        assertEquals(plain.classification, padded.classification)
        assertTrue(abs(plain.fraudProbability - padded.fraudProbability) < 1e-12)
    }

    @Test
    fun char02_classifierAcceptsExactly5000Characters() {
        val result = classifier.classify("a".repeat(5000))
        assertTrue(result.fraudProbability in 0.0..1.0)
    }

    @Test
    fun char03_classifierRejects5001CharactersAfterTrim() {
        assertThrowsIllegalArgument { classifier.classify("a".repeat(5001)) }
    }

    @Test
    fun char04_classifierRejectsBlankMessages() {
        assertThrowsIllegalArgument { classifier.classify("   \t\r\n  ") }
    }

    @Test
    fun char05_classifierProbabilitiesAreNormalizedAndConfidenceIsMax() {
        val res = classifier.classify("Mukapeza MK 50,000 bonus. Tumizani PIN yanu tsopano.")
        assertTrue(res.fraudProbability in 0.0..1.0)
        assertTrue(res.normalProbability in 0.0..1.0)
        assertTrue(abs((res.fraudProbability + res.normalProbability) - 1.0) < 1e-12)
        assertEquals(maxOf(res.fraudProbability, res.normalProbability), res.confidence, 1e-12)
    }

    @Test
    fun char06_classifierDecisionRuleMatchesProbabilityComparison() {
        val res = classifier.classify("TNM Mpamba transaction successful. Balance MK 8,200.")
        val expected = if (res.fraudProbability >= res.normalProbability) {
            DetectionClassification.FRAUDULENT
        } else {
            DetectionClassification.LEGITIMATE
        }
        assertEquals(expected, res.classification)
    }

    @Test
    fun char07_classifierHandlesZeroNormWhenNoVocabularyTermsMatch() {
        val res = OfflineSmsClassifier.fromJson(JSONObject(modelJsonText)).classify("zzzzqqqqxxxx")
        assertTrue(res.fraudProbability in 0.0..1.0)
        assertTrue(res.normalProbability in 0.0..1.0)
    }

    @Test
    fun char08_classifierRejectsMismatchedFeatureCount() {
        val json = JSONObject(modelJsonText)
        json.put("featureCount", json.getInt("featureCount") + 1)
        assertThrowsJsonException { OfflineSmsClassifier.fromJson(json) }
    }

    @Test
    fun char09_classifierRejectsUnsupportedPositiveClass() {
        val json = JSONObject(modelJsonText)
        json.put("positiveClass", "spam")
        assertThrowsJsonException { OfflineSmsClassifier.fromJson(json) }
    }

    @Test
    fun char10_tokenPatternCompilesWithUnicodeFlagOnJvm() {
        val compiled = OfflineSmsClassifier.compileTokenPattern("\\b\\w\\w+\\b", true)
        assertTrue((compiled.flags() and Pattern.UNICODE_CHARACTER_CLASS) != 0)
    }

    @Test
    fun char11_loaderFailureDetailsDoNotIncludeSmsContent() {
        val secretSms = "SECRET_PIN_9988_DO_NOT_LEAK"
        val result = OfflineModelLoader.load {
            throw RuntimeException("boom while reading $secretSms")
        }
        assertEquals(ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED, result.status)
        assertFalse((result.detail ?: "").contains(secretSms))
    }

    @Test
    fun char12_loaderReturnsReadyClassifierForValidAsset() {
        val result = OfflineModelLoader.load { modelJsonText }
        assertTrue(result.isReady)
        assertNotNull(result.classifier)
    }

    @Test
    fun char13_multipartAssemblySortsBySequenceIndexThenBody() {
        val parts = listOf(
            SmsPart("Airtel", " second", 10L, sequenceIndex = 1, subscriptionId = 0),
            SmsPart("Airtel", "first", 10L, sequenceIndex = 0, subscriptionId = 0)
        )
        assertEquals("first second", SmsMessageProcessor.assembleBody(parts))
    }

    @Test
    fun char14_udhRejectsTruncatedHeaderLength() {
        val badPdu = byteArrayOf(
            0x00, 0x44, 0x01, 0x91.toByte(), 0x21, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x05,
            0x20,
            0x00, 0x03
        )
        assertEquals(null, SmsMessageProcessor.udhSequenceNumber(badPdu))
    }

    @Test
    fun char15_fingerprintChangesWhenSubscriptionIdChanges() {
        val p1 = SmsPart("Airtel", "Hi", 500L, sequenceIndex = 0, subscriptionId = 10)
        val p2 = SmsPart("Airtel", "Hi", 500L, sequenceIndex = 0, subscriptionId = 20)
        assertTrue(SmsMessageProcessor.fingerprint(p1) != SmsMessageProcessor.fingerprint(p2))
    }

    @Test
    fun char16_entityFallbackFingerprintIsDeterministicAcrossCalls() {
        val record = DetectionRecord(
            id = "id-1",
            sender = "Mpamba",
            message = "Test",
            classification = DetectionClassification.LEGITIMATE,
            confidence = 0.8f,
            timestampMillis = 2000L,
            fingerprint = ""
        )
        val e1 = DetectionEntity.fromDomain(record)
        val e2 = DetectionEntity.fromDomain(record)
        assertEquals(e1.fingerprint, e2.fingerprint)
        assertTrue(e1.fingerprint.isNotEmpty())
    }

    @Test
    fun char17_detectionFilterExcludesNotAnalysedFromFraudAndNormal() {
        val notAnalysed = DetectionRecord(
            id = "id-na",
            sender = "0990000000",
            message = "Raw",
            classification = DetectionClassification.NOT_ANALYSED,
            confidence = null,
            timestampMillis = 1000L
        )
        assertFalse(DetectionFilter.FRAUDULENT.matches(notAnalysed))
        assertFalse(DetectionFilter.NORMAL.matches(notAnalysed))
        assertTrue(DetectionFilter.ALL.matches(notAnalysed))
    }

    @Test
    fun char18_protectionReadinessListsAllBlockersWhenNothingIsReady() {
        val status = evaluateProtectionReadiness(
            smsPermissionGranted = false,
            notificationPermissionGranted = false,
            modelReady = false,
            receiverConfigured = false
        )
        assertFalse(status.canEnable)
        assertEquals(4, status.blockers.size)
        assertTrue(status.blockers.contains(ProtectionBlocker.MODEL_UNAVAILABLE))
    }

    @Test
    fun char19_fraudNotificationTruncatesLongPreviewWithin180Chars() {
        val record = DetectionRecord(
            id = "id-long",
            sender = "Scammer",
            message = "Win big cash ".repeat(40),
            classification = DetectionClassification.FRAUDULENT,
            confidence = 0.95f,
            timestampMillis = 3000L
        )
        val content = fraudNotificationContent(record)
        assertTrue(content.preview.length <= 180)
    }

    @Test
    fun char20_dashboardSummaryExcludesNotAnalysedFromCounts() {
        val items = listOf(
            DetectionRecord("1", "A", "m1", DetectionClassification.FRAUDULENT, 0.9f, 1L),
            DetectionRecord("2", "B", "m2", DetectionClassification.NOT_ANALYSED, null, 2L)
        )
        val summary = summarizeDetectionRecords(items)
        assertEquals(1, summary.totalAnalysed)
        assertEquals(1, summary.fraudulentDetected)
        assertEquals(0, summary.legitimateDetected)
        assertTrue(formatConfidence(null).isNotEmpty())
        assertTrue(formatDetectionTimestamp(0L).isNotEmpty())
        assertTrue(greetingForHour(9).isNotEmpty())
    }

    private fun assertThrowsIllegalArgument(block: () -> Unit) {
        try {
            block()
        } catch (_: IllegalArgumentException) {
            return
        }
        fail("Expected IllegalArgumentException")
    }

    private fun assertThrowsJsonException(block: () -> Unit) {
        try {
            block()
        } catch (_: JSONException) {
            return
        }
        fail("Expected JSONException")
    }
}

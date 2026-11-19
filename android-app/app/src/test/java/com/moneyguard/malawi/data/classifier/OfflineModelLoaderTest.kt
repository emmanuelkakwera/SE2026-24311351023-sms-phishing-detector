package com.moneyguard.malawi.data.classifier

import com.moneyguard.malawi.domain.model.DetectionClassification
import com.moneyguard.malawi.domain.protection.ProtectionBlocker
import com.moneyguard.malawi.domain.protection.evaluateProtectionReadiness
import java.io.File
import java.io.FileNotFoundException
import java.util.regex.Pattern
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class OfflineModelLoaderTest {

    private val realModelJson = File("../../assets/model/moneyguard_model.json").readText(Charsets.UTF_8)

    @Test
    fun realModelAssetLoadsAndClassifiesFraudAndNormal() {
        val result = OfflineModelLoader.load { realModelJson }

        assertTrue(result.isReady)
        assertEquals(ClassifierLoadStatus.CLASSIFIER_READY, result.status)
        assertNotNull(result.classifier)

        val fraud = result.classifier!!.classify(
            "URGENT: your account will be blocked. Send your PIN to 0999 now."
        )
        val normal = result.classifier.classify(
            "Airtel Money balance is MK 12,500. Zikomo for using our service."
        )

        assertEquals(DetectionClassification.FRAUDULENT, fraud.classification)
        assertEquals(DetectionClassification.LEGITIMATE, normal.classification)
        assertTrue(fraud.fraudProbability > 0.5)
        assertTrue(normal.normalProbability > 0.5)
    }

    @Test
    fun missingAssetHasAnExplicitStatusCode() {
        val result = OfflineModelLoader.load {
            throw FileNotFoundException("moneyguard_model.json")
        }

        assertFalse(result.isReady)
        assertEquals(ClassifierLoadStatus.MODEL_ASSET_MISSING, result.status)
    }

    @Test
    fun invalidJsonHasAnExplicitStatusCode() {
        val result = OfflineModelLoader.load { "{not json" }

        assertFalse(result.isReady)
        assertEquals(ClassifierLoadStatus.MODEL_PARSE_FAILED, result.status)
    }

    @Test
    fun unsupportedVersionHasAnExplicitStatusCode() {
        val altered = realModelJson.replaceFirst("\"version\":1", "\"version\":99")
        val result = OfflineModelLoader.load { altered }

        assertFalse(result.isReady)
        assertEquals(ClassifierLoadStatus.MODEL_VERSION_UNSUPPORTED, result.status)
    }

    @Test
    fun invalidSchemaIsReportedAsInitializationFailure() {
        val altered = realModelJson.replaceFirst("\"norm\":\"l2\"", "\"norm\":\"bad\"")
        val result = OfflineModelLoader.load { altered }

        assertFalse(result.isReady)
        assertEquals(ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED, result.status)
    }

    @Test
    fun androidPatternFlagRejectionFallsBackWithoutChangingThePattern() {
        val expected = Pattern.compile("\\b\\w\\w+\\b", 0)

        val desktop = OfflineSmsClassifier.compileTokenPattern("\\b\\w\\w+\\b", true)
        assertTrue(
            "Desktop JVM should use Unicode character classes",
            desktop.flags() and Pattern.UNICODE_CHARACTER_CLASS != 0
        )
        assertEquals(expected.pattern(), desktop.pattern())

        val androidLike = OfflineSmsClassifier.compileTokenPattern(
            pattern = "\\b\\w\\w+\\b",
            unicodeTokens = true,
            compile = { _, flags ->
                if (flags != 0) throw IllegalArgumentException("UNICODE_CHARACTER_CLASS flag not supported")
                Pattern.compile("\\b\\w\\w+\\b", 0)
            }
        )
        assertEquals(0, androidLike.flags())
        assertEquals(expected.pattern(), androidLike.pattern())
    }

    @Test
    fun failedClassifierLoadBlocksProtection() {
        val readiness = evaluateProtectionReadiness(
            smsPermissionGranted = true,
            notificationPermissionGranted = true,
            modelReady = false,
            receiverConfigured = true
        )

        assertFalse(readiness.canEnable)
        assertTrue(readiness.blockers.contains(ProtectionBlocker.MODEL_UNAVAILABLE))
    }
}

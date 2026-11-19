package com.moneyguard.malawi.data.classifier

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.moneyguard.malawi.domain.model.DetectionClassification
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OfflineSmsClassifierTest {
    @Test
    fun predictionsMatchTheFittedModelExamples() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val classifier = OfflineSmsClassifier.fromAssets(context)
        val examples = listOf(
            Example(
                "Chepetsani nthawi ndi ndalama! Lipilani ndalama zamayeso za PSLCE, JCE and MSCE " +
                    "mosavuta pogwiritsa ntchito Airtel Money. Imbani *919# kenako lowetsani " +
                    "nambala ya inivoyisi yanu. Ndizophweka!",
                DetectionClassification.LEGITIMATE,
                0.3738659233585281
            ),
            Example(
                "Ndine agent wa Airtel money. ndatumiza ndalama ku nambala yanu mwangozi chonde bwezani.",
                DetectionClassification.FRAUDULENT,
                0.8576934570789491
            ),
            Example(
                "TNM Mpamba yodalilika. Yotetezeka",
                DetectionClassification.LEGITIMATE,
                0.25747240751099565
            ),
            Example(
                "Ndine agent wa TNM mpamba ndakutumizilani ndalama ku nambala yanu molakwika " +
                    "mukupemphedwa kuti mupange reverse",
                DetectionClassification.FRAUDULENT,
                0.8438556099450383
            ),
            Example(
                "Dear customer, your Mpamba main balance is MK 95000. Thank you for using TNM Mpamba.",
                DetectionClassification.LEGITIMATE,
                0.22008160751391725
            ),
            Example(
                "Your Airtel Money loan of MK 100000 has been approved. Call 0992867825 or send " +
                    "your PIN to complete disbursement.",
                DetectionClassification.FRAUDULENT,
                0.8934265922089897
            ),
            Example(
                "Airtel Money mogwirizana ndi OLD mutual yakubweretserani Phuka Digital Savings. " +
                    "Njira yodalirika yosungira ndalama zanu kudzera pa Airtel Money. Lembetsani " +
                    "lero ndi ndalama yosachepera K5000 poimba *211# sankhani 5 kenako 2.",
                DetectionClassification.LEGITIMATE,
                0.33406844199819896
            )
        )

        examples.forEach { example ->
            val result = classifier.classify(example.message)
            assertEquals(example.message, example.classification, result.classification)
            example.expectedFraudProbability?.let { expected ->
                assertTrue(
                    "Probability mismatch for: ${example.message}",
                    kotlin.math.abs(expected - result.fraudProbability) < 1e-8
                )
            }
        }
    }

    @Test
    fun loaderReportsReadyForThePackagedRealModel() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val result = OfflineModelLoader.load(context)

        assertEquals(ClassifierLoadStatus.CLASSIFIER_READY, result.status)
        assertTrue(result.isReady)
        assertEquals(null, result.error)
    }

    @Test
    fun rejectsEmptyAndOversizedMessages() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val classifier = OfflineSmsClassifier.fromAssets(context)

        assertIllegalArgument { classifier.classify(" \n ") }
        assertIllegalArgument { classifier.classify("x".repeat(5001)) }
    }

    private fun assertIllegalArgument(block: () -> Unit) {
        try {
            block()
        } catch (_: IllegalArgumentException) {
            return
        }
        throw AssertionError("Expected IllegalArgumentException")
    }

    private data class Example(
        val message: String,
        val classification: DetectionClassification,
        val expectedFraudProbability: Double?
    )
}

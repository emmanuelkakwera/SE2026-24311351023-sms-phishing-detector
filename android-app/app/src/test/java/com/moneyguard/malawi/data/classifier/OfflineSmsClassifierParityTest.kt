package com.moneyguard.malawi.data.classifier

import com.moneyguard.malawi.domain.model.DetectionClassification
import java.io.File
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

/**
 * Compares the Kotlin implementation directly with the fitted Python pipeline.
 * The expected values come from tests/mobile_parity_fixtures.json, which is
 * generated from MoneyGuard_model.joblib by tests/generate_parity_fixtures.py.
 */
class OfflineSmsClassifierParityTest {

    private val modelJson: JSONObject by lazy {
        JSONObject(modelFile.readText(Charsets.UTF_8))
    }
    private val classifier: OfflineSmsClassifier by lazy {
        OfflineSmsClassifier.fromJson(modelJson)
    }

    @Test
    fun predictionsMatchTheOriginalPythonPipeline() {
        val fixture = JSONObject(fixturesFile.readText(Charsets.UTF_8))
        val cases = fixture.getJSONArray("cases")
        assertEquals("fixture case count", 12, cases.length())

        for (index in 0 until cases.length()) {
            val case = cases.getJSONObject(index)
            val id = case.getString("id")
            val message = case.getString("message")
            val result = classifier.classify(message)

            val expectedLabel = case.getString("expectedLabel")
            val actualLabel = when (result.classification) {
                DetectionClassification.FRAUDULENT -> "fraud"
                DetectionClassification.LEGITIMATE -> "normal"
                DetectionClassification.NOT_ANALYSED ->
                    error("$id: message was not analysed")
            }
            assertEquals("$id: label", expectedLabel, actualLabel)

            val expectedFraudProbability = case.getDouble("expectedFraudProbability")
            assertTrue(
                "$id: expected fraud probability $expectedFraudProbability " +
                    "but Kotlin returned ${result.fraudProbability}",
                kotlin.math.abs(expectedFraudProbability - result.fraudProbability) < 1e-8
            )

            assertTrue(
                "$id: probability outside [0, 1]",
                result.fraudProbability in 0.0..1.0 &&
                    result.normalProbability in 0.0..1.0
            )
            assertTrue(
                "$id: confidence must be the larger class probability",
                kotlin.math.abs(
                    result.confidence - maxOf(result.fraudProbability, result.normalProbability)
                ) < 1e-12
            )
            assertTrue(
                "$id: class probabilities must sum to one",
                kotlin.math.abs(
                    result.fraudProbability + result.normalProbability - 1.0
                ) < 1e-12
            )
        }
    }

    @Test
    fun exportedTfidfFeaturesMatchThePythonPipelineMetadata() {
        assertEquals(8356, modelJson.getInt("featureCount"))
        assertEquals(modelJson.getInt("featureCount"), modelJson.getJSONObject("vocabulary").length())
        assertEquals(modelJson.getInt("featureCount"), modelJson.getJSONArray("idf").length())
        assertEquals(modelJson.getInt("featureCount"), modelJson.getJSONArray("coefficients").length())
        assertEquals("l2", modelJson.getString("norm"))
        assertEquals("word", modelJson.getString("analyzer"))
        assertEquals(1, modelJson.getInt("ngramMin"))
        assertEquals(2, modelJson.getInt("ngramMax"))
    }

    @Test
    fun emptyMessagesAreRejectedInsteadOfBeingClassified() {
        listOf("", "   ", "\n\t").forEach { message ->
            assertIllegalArgument { classifier.classify(message) }
        }
    }

    @Test
    fun oversizedMessagesAreRejectedInsteadOfBeingClassified() {
        assertIllegalArgument { classifier.classify("x".repeat(5001)) }
    }

    @Test
    fun unavailableModelCannotBeLoaded() {
        assertJsonException {
            OfflineSmsClassifier.fromJson(JSONObject("""{"version": 999}"""))
        }
    }

    @Test
    fun unsupportedVectoriserSettingsCannotBeLoaded() {
        val altered = JSONObject(modelJson.toString())
        altered.put("norm", "l1")
        assertJsonException { OfflineSmsClassifier.fromJson(altered) }
    }

    private fun assertIllegalArgument(block: () -> Unit) {
        try {
            block()
        } catch (_: IllegalArgumentException) {
            return
        }
        fail("Expected IllegalArgumentException")
    }

    private fun assertJsonException(block: () -> Unit) {
        try {
            block()
        } catch (_: JSONException) {
            return
        }
        fail("Expected JSONException")
    }

    private companion object {
        // Gradle runs local unit tests with the module directory as working dir.
        val modelFile = File("../../assets/model/moneyguard_model.json")
        val fixturesFile = File("../../../tests/mobile_parity_fixtures.json")
    }
}

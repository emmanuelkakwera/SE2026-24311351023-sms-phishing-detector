package com.moneyguard.malawi.slices

import com.moneyguard.malawi.data.classifier.OfflineSmsClassifier
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VerticalSlicesTest {
    private fun buildTestClassifier(): OfflineSmsClassifier {
        val json = JSONObject().apply {
            put("version", 1)
            put("norm", "l2")
            put("analyzer", "word")
            put("useIdf", true)
            put("sublinearTf", false)
            put("smoothIdf", true)
            put("stripAccents", JSONObject.NULL)
            put("stopWords", JSONObject.NULL)
            put("vocabulary", JSONObject().put("tumiza", 0).put("ndalama", 1).put("bundle", 2))
            put("idf", JSONArray(listOf(1.2, 1.1, 1.0)))
            put("coefficients", JSONArray(listOf(2.5, 2.2, -1.8)))
            put("intercept", -0.5)
            put("positiveClass", "fraud")
            put("tokenPattern", "\\b\\w+\\b")
            put("unicodeTokens", false)
            put("ngramMin", 1)
            put("ngramMax", 1)
            put("lowercase", true)
            put("featureCount", 3)
        }
        return OfflineSmsClassifier.fromJson(json)
    }

    @Test
    fun allThreeSlicesRunEndToEndSuccessfully() {
        val summary = SliceRunner.runAllSlices(buildTestClassifier())
        assertTrue(summary.allPassed)
    }

    @Test
    fun reportRequiresExplicitUserConsent() {
        val queue = ReportReviewQueue()
        val accepted = queue.submitUserReport(
            reportId = "rep-no-consent",
            sender = "+265991112222",
            messageBody = "Test message",
            userConsented = false,
            submittedAtMillis = 1763800001000L
        )
        assertFalse(accepted)
        assertEquals(0, queue.pendingReports().size)
    }
}

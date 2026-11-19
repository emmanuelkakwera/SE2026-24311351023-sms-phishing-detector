package com.moneyguard.malawi.data.classifier

import android.content.Context
import com.moneyguard.malawi.domain.model.DetectionClassification
import java.util.Locale
import java.util.regex.Pattern
import kotlin.math.exp
import kotlin.math.sqrt
import org.json.JSONException
import org.json.JSONObject

data class SmsClassification(
    val classification: DetectionClassification,
    val confidence: Double,
    val fraudProbability: Double,
    val normalProbability: Double
)

class OfflineSmsClassifier private constructor(
    private val model: Model
) {
    fun classify(message: String): SmsClassification {
        val text = message.trim()
        require(text.isNotEmpty()) { "The SMS body is empty." }
        require(text.length <= MAX_MESSAGE_LENGTH) {
            "The SMS body exceeds the supported length."
        }

        val matcher = model.tokenPattern.matcher(
            if (model.lowercase) text.lowercase(Locale.ROOT) else text
        )
        val tokens = buildList {
            while (matcher.find()) add(matcher.group())
        }
        val counts = HashMap<String, Int>()
        for (size in model.ngramMin..model.ngramMax) {
            if (tokens.size < size) continue
            for (start in 0..tokens.size - size) {
                val term = (start until start + size).joinToString(" ") { tokens[it] }
                counts[term] = (counts[term] ?: 0) + 1
            }
        }

        val features = counts.mapNotNull { (term, count) ->
            model.vocabulary[term]?.let { index ->
                index to count * model.idf[index]
            }
        }
        val norm = sqrt(features.sumOf { (_, value) -> value * value })
        var decision = model.intercept
        if (norm > 0.0) {
            for ((index, value) in features) {
                decision += model.coefficients[index] * (value / norm)
            }
        }

        val positiveProbability = sigmoid(decision)
        val fraudProbability = when (model.positiveClass) {
            "fraud" -> positiveProbability
            "normal" -> 1.0 - positiveProbability
            else -> throw IllegalStateException("Unsupported model positive class.")
        }.coerceIn(0.0, 1.0)
        val normalProbability = 1.0 - fraudProbability
        val classification = if (fraudProbability >= normalProbability) {
            DetectionClassification.FRAUDULENT
        } else {
            DetectionClassification.LEGITIMATE
        }
        val confidence = maxOf(fraudProbability, normalProbability)

        return SmsClassification(
            classification = classification,
            confidence = confidence,
            fraudProbability = fraudProbability,
            normalProbability = normalProbability
        )
    }

    fun verifyReady() {
        check(model.coefficients.isNotEmpty())
    }

    private data class Model(
        val vocabulary: Map<String, Int>,
        val idf: DoubleArray,
        val coefficients: DoubleArray,
        val intercept: Double,
        val positiveClass: String,
        val tokenPattern: Pattern,
        val ngramMin: Int,
        val ngramMax: Int,
        val lowercase: Boolean
    )

    companion object {
        private const val MAX_MESSAGE_LENGTH = 5000

        fun fromAssets(context: Context): OfflineSmsClassifier {
            val result = OfflineModelLoader.load(context)
            return result.classifier ?: throw IllegalStateException(
                "Classifier load failed: ${result.status.code}",
                result.error
            )
        }

        internal fun fromJson(payload: JSONObject): OfflineSmsClassifier {
            val version = payload.optInt("version", -1)
            if (version != 1) throw JSONException("Unsupported model version: $version")

            // The Kotlin implementation is equivalent to scikit-learn only for
            // this exact vectoriser configuration. Reject anything else rather
            // than silently producing predictions that differ from Python.
            requireOption(payload, "norm", "l2")
            requireOption(payload, "analyzer", "word")
            requireOption(payload, "useIdf", true)
            requireOption(payload, "sublinearTf", false)
            requireOption(payload, "smoothIdf", true)
            requireOption(payload, "stripAccents", JSONObject.NULL)
            requireOption(payload, "stopWords", JSONObject.NULL)

            val vocabularyJson = payload.getJSONObject("vocabulary")
            val vocabulary = HashMap<String, Int>(vocabularyJson.length() * 2)
            val keys = vocabularyJson.keys()
            while (keys.hasNext()) {
                val term = keys.next()
                vocabulary[term] = vocabularyJson.getInt(term)
            }

            val idfJson = payload.getJSONArray("idf")
            val coefficientsJson = payload.getJSONArray("coefficients")
            val idf = DoubleArray(idfJson.length()) { idfJson.getDouble(it) }
            val coefficients = DoubleArray(coefficientsJson.length()) {
                coefficientsJson.getDouble(it)
            }
            if (idf.isEmpty() || coefficients.size != idf.size ||
                vocabulary.values.any { it !in idf.indices }
            ) {
                throw JSONException("Model feature arrays do not match the vocabulary.")
            }
            if (payload.optInt("featureCount", -1) != vocabulary.size) {
                throw JSONException("Model featureCount does not match the vocabulary.")
            }

            val positiveClass = payload.getString("positiveClass")
            if (positiveClass != "fraud" && positiveClass != "normal") {
                throw JSONException("Unsupported model positive class: $positiveClass")
            }
            val tokenPatternText = payload.getString("tokenPattern")
            val tokenPattern = compileTokenPattern(
                pattern = tokenPatternText,
                unicodeTokens = payload.optBoolean("unicodeTokens", true)
            )

            return OfflineSmsClassifier(
                Model(
                    vocabulary = vocabulary,
                    idf = idf,
                    coefficients = coefficients,
                    intercept = payload.getDouble("intercept"),
                    positiveClass = positiveClass,
                    tokenPattern = tokenPattern,
                    ngramMin = payload.getInt("ngramMin"),
                    ngramMax = payload.getInt("ngramMax"),
                    lowercase = payload.getBoolean("lowercase")
                )
            )
        }

        private fun requireOption(payload: JSONObject, key: String, expected: Any) {
            val actual = payload.opt(key)
            if (actual != expected) {
                throw JSONException(
                    "Unsupported model option '$key': expected '$expected' but found '$actual'."
                )
            }
        }

        /**
         * scikit-learn uses `(?u)\b\w\w+\b`, so Unicode word classes are required.
         *
         * Desktop JVM needs [Pattern.UNICODE_CHARACTER_CLASS] for that behaviour.
         * Android always uses Unicode character classes and throws
         * `IllegalArgumentException` when that flag is passed, so fall back to
         * a flag-free pattern on Android. The token pattern itself is unchanged.
         */
        internal fun compileTokenPattern(
            pattern: String,
            unicodeTokens: Boolean,
            compile: (String, Int) -> Pattern = { regex, flags -> Pattern.compile(regex, flags) }
        ): Pattern {
            if (!unicodeTokens) return compile(pattern, 0)
            return try {
                compile(pattern, Pattern.UNICODE_CHARACTER_CLASS)
            } catch (error: IllegalArgumentException) {
                // Android runtime: Unicode classes are already the default.
                compile(pattern, 0)
            }
        }

        private fun sigmoid(value: Double): Double =
            if (value >= 0.0) {
                1.0 / (1.0 + exp(-value))
            } else {
                val exponential = exp(value)
                exponential / (1.0 + exponential)
            }
    }
}

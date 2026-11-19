package expo.modules.moneyguardsms

import android.content.Context
import java.util.Locale
import java.util.regex.Pattern
import kotlin.math.exp
import kotlin.math.sqrt
import org.json.JSONException
import org.json.JSONObject

/**
 * Kotlin port of the existing Python/Android TF-IDF + Logistic Regression pipeline.
 * Inference is entirely on-device and uses the same bundled model JSON as the app.
 *
 * The transform matches scikit-learn's TfidfVectorizer(word, 1-2 grams, smooth
 * IDF, L2 norm) and the fitted LogisticRegression decision function.
 */
object OfflineSmsClassifier {

  private const val ASSET_NAME = "moneyguard_model.json"
  private const val MAX_MESSAGE_LENGTH = 5000
  private val lock = Any()

  private val stopWords = setOf(
    "a", "an", "and", "are", "as", "at", "be", "been", "but", "by", "for", "from",
    "had", "has", "have", "he", "her", "his", "i", "if", "in", "is", "it", "its",
    "me", "my", "of", "on", "or", "our", "she", "so", "that", "the", "their", "them",
    "they", "this", "to", "was", "we", "were", "what", "when", "where", "which", "who",
    "will", "with", "you", "your", "wa", "pa", "ndi", "kuti", "mu", "ku", "la", "za",
    "ndipo", "iyi", "iyo", "uyu", "uyo", "ali"
  )

  @Volatile
  private var cachedModel: Model? = null

  fun analyze(context: Context, message: String): AnalysisOutcome {
    val text = message.trim()
    if (text.isEmpty()) return AnalysisOutcome.Failure("The SMS body is empty.")
    if (text.length > MAX_MESSAGE_LENGTH) {
      return AnalysisOutcome.Failure("Messages must be at most $MAX_MESSAGE_LENGTH characters.")
    }

    val model = try {
      getModel(context)
    } catch (error: Throwable) {
      return AnalysisOutcome.Failure(
        "The offline model could not be loaded (${error.javaClass.simpleName})."
      )
    }

    val normalizedText = if (model.lowercase) text.lowercase(Locale.ROOT) else text
    val matcher = model.tokenPattern.matcher(normalizedText)
    val tokens = ArrayList<String>()
    while (matcher.find()) tokens.add(matcher.group())

    val counts = HashMap<String, Int>()
    for (n in model.ngramMin..model.ngramMax) {
      if (tokens.size < n) continue
      for (index in 0..tokens.size - n) {
        val term = buildString {
          for (offset in 0 until n) {
            if (offset > 0) append(' ')
            append(tokens[index + offset])
          }
        }
        counts[term] = (counts[term] ?: 0) + 1
      }
    }

    val weightedFeatures = ArrayList<WeightedFeature>(counts.size)
    var normSquared = 0.0
    for ((term, count) in counts) {
      val featureIndex = model.vocabulary[term] ?: continue
      val tfIdf = count * model.idf[featureIndex]
      weightedFeatures.add(WeightedFeature(term, featureIndex, tfIdf))
      normSquared += tfIdf * tfIdf
    }

    val norm = sqrt(normSquared)
    var decision = model.intercept
    if (norm > 0.0) {
      for (feature in weightedFeatures) {
        decision += model.coefficients[feature.index] * (feature.value / norm)
      }
    }

    val positiveProbability = sigmoid(decision)
    val fraudProbability = when (model.positiveClass) {
      "fraud" -> positiveProbability
      "normal" -> 1.0 - positiveProbability
      else -> return AnalysisOutcome.Failure(
        "The bundled model has an unsupported positive class."
      )
    }.coerceIn(0.0, 1.0)
    val normalProbability = (1.0 - fraudProbability).coerceIn(0.0, 1.0)

    // Same rule as the JavaScript classifier: the higher probability wins.
    val fraudulent = fraudProbability >= normalProbability
    val confidence = if (fraudulent) fraudProbability else normalProbability
    val explanation = buildExplanation(
      weightedFeatures = weightedFeatures,
      norm = norm,
      model = model,
      fraudulent = fraudulent
    )

    return if (fraudulent) {
      AnalysisOutcome.Fraudulent(
        confidence = confidence,
        fraudProbability = fraudProbability,
        normalProbability = normalProbability,
        explanation = explanation.summary,
        signals = explanation.signals
      )
    } else {
      AnalysisOutcome.Legitimate(
        confidence = confidence,
        fraudProbability = fraudProbability,
        normalProbability = normalProbability,
        explanation = explanation.summary,
        signals = explanation.signals
      )
    }
  }

  private data class Explanation(val summary: String, val signals: List<String>)

  private fun buildExplanation(
    weightedFeatures: List<WeightedFeature>,
    norm: Double,
    model: Model,
    fraudulent: Boolean
  ): Explanation {
    val fraudDirection = if (model.positiveClass == "fraud") 1.0 else -1.0
    val candidates = weightedFeatures.map { feature ->
      val impact = if (norm > 0.0) {
        fraudDirection * model.coefficients[feature.index] * feature.value / norm
      } else {
        0.0
      }
      feature.term to impact
    }

    val filtered = candidates
      .filter { (term, impact) ->
        isMeaningful(term) && if (fraudulent) impact > 0.0 else impact < 0.0
      }
      .sortedByDescending { (_, impact) -> kotlin.math.abs(impact) }

    val selected = ArrayList<Pair<String, Double>>()
    for (candidate in filtered) {
      if (selected.any { (chosen) ->
          candidate.first.contains(chosen) || chosen.contains(candidate.first)
        }
      ) {
        continue
      }
      selected.add(candidate)
      if (selected.size >= 5) break
    }

    val classWord = if (fraudulent) "fraudulent" else "legitimate"
    val direction = if (fraudulent) "fraud-associated" else "legitimate-associated"
    val quoted = selected.joinToString(", ") { "'${it.first}'" }
    val summary = if (selected.isEmpty()) {
      "The model classified this message as $classWord. No individual $direction terms " +
        "dominated; the decision is based on the model's overall text pattern. " +
        "This is an automated risk prediction, not proof."
    } else {
      "The model classified this message as $classWord. The strongest $direction text " +
        "signals were: $quoted. This is an automated risk prediction, not proof."
    }

    return Explanation(summary, selected.map { it.first })
  }

  private fun isMeaningful(term: String): Boolean {
    if (term.none { it.isLetter() }) return false
    if (term.contains(' ')) return true
    return term.lowercase(Locale.ROOT) !in stopWords
  }

  private fun sigmoid(value: Double): Double =
    if (value >= 0.0) {
      1.0 / (1.0 + exp(-value))
    } else {
      val exponential = exp(value)
      exponential / (1.0 + exponential)
    }

  private fun getModel(context: Context): Model {
    cachedModel?.let { return it }
    synchronized(lock) {
      cachedModel?.let { return it }
      val model = loadModel(context.applicationContext)
      cachedModel = model
      return model
    }
  }

  private fun loadModel(context: Context): Model {
    val payload = context.assets.open(ASSET_NAME)
      .bufferedReader(Charsets.UTF_8)
      .use { JSONObject(it.readText()) }
    val version = payload.optInt("version", -1)
    if (version != 1) {
      throw JSONException("Unsupported offline model version: $version")
    }

    val vocabularyJson = payload.getJSONObject("vocabulary")
    val vocabulary = HashMap<String, Int>(vocabularyJson.length() * 2)
    val vocabularyKeys = vocabularyJson.keys()
    while (vocabularyKeys.hasNext()) {
      val term = vocabularyKeys.next()
      vocabulary[term] = vocabularyJson.getInt(term)
    }

    val idfJson = payload.getJSONArray("idf")
    val idf = DoubleArray(idfJson.length()) { idfJson.getDouble(it) }
    val coefficientsJson = payload.getJSONArray("coefficients")
    val coefficients = DoubleArray(coefficientsJson.length()) { coefficientsJson.getDouble(it) }
    if (idf.isEmpty() || coefficients.size != idf.size ||
      vocabulary.values.any { it !in idf.indices }
    ) {
      throw JSONException("The bundled offline model has inconsistent feature data.")
    }

    val positiveClass = payload.getString("positiveClass")
    if (positiveClass != "fraud" && positiveClass != "normal") {
      throw JSONException("The bundled offline model has an unsupported class.")
    }
    val tokenPattern = payload.optString("tokenPattern", "\\b\\w\\w+\\b")
    val flags = if (payload.optBoolean("unicodeTokens", true)) {
      Pattern.UNICODE_CHARACTER_CLASS
    } else {
      0
    }

    return Model(
      vocabulary = vocabulary,
      idf = idf,
      coefficients = coefficients,
      intercept = payload.getDouble("intercept"),
      positiveClass = positiveClass,
      tokenPattern = Pattern.compile(tokenPattern, flags),
      ngramMin = payload.optInt("ngramMin", 1),
      ngramMax = payload.optInt("ngramMax", 2),
      lowercase = payload.optBoolean("lowercase", true)
    )
  }

  private data class WeightedFeature(
    val term: String,
    val index: Int,
    val value: Double
  )

  private class Model(
    val vocabulary: HashMap<String, Int>,
    val idf: DoubleArray,
    val coefficients: DoubleArray,
    val intercept: Double,
    val positiveClass: String,
    val tokenPattern: Pattern,
    val ngramMin: Int,
    val ngramMax: Int,
    val lowercase: Boolean
  )
}

sealed class AnalysisOutcome {
  abstract val confidence: Double?
  abstract val fraudProbability: Double?
  abstract val normalProbability: Double?
  abstract val explanation: String
  abstract val signals: List<String>

  data class Fraudulent(
    override val confidence: Double,
    override val fraudProbability: Double,
    override val normalProbability: Double,
    override val explanation: String,
    override val signals: List<String>
  ) : AnalysisOutcome()

  data class Legitimate(
    override val confidence: Double,
    override val fraudProbability: Double,
    override val normalProbability: Double,
    override val explanation: String,
    override val signals: List<String>
  ) : AnalysisOutcome()

  data class Failure(val reason: String) : AnalysisOutcome() {
    override val confidence: Double? = null
    override val fraudProbability: Double? = null
    override val normalProbability: Double? = null
    override val explanation: String = "MoneyGuard could not analyse this message: $reason " +
      "Treat it with caution and verify the sender independently."
    override val signals: List<String> = emptyList()
  }
}

package com.moneyguard.malawi.data.classifier

import android.content.Context
import java.io.FileNotFoundException
import java.io.IOException
import org.json.JSONException
import org.json.JSONObject

/**
 * Loads the fitted model once and reports a precise cause on failure.
 *
 * The caller should keep the returned result and reuse [ClassifierLoadResult.classifier].
 * No SMS content is ever included in errors or logs.
 */
object OfflineModelLoader {

    const val ASSET_NAME = "moneyguard_model.json"

    fun load(context: Context): ClassifierLoadResult = load(
        readModelJson = {
            context.assets.open(ASSET_NAME).bufferedReader(Charsets.UTF_8).use { it.readText() }
        }
    )

    internal fun load(readModelJson: () -> String): ClassifierLoadResult {
        val jsonText = try {
            readModelJson()
        } catch (error: FileNotFoundException) {
            return failure(
                ClassifierLoadStatus.MODEL_ASSET_MISSING,
                error,
                "Reinstall MoneyGuard with the current APK."
            )
        } catch (error: IOException) {
            return failure(
                ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED,
                error,
                "The model asset could not be read."
            )
        } catch (error: Throwable) {
            return failure(
                ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED,
                error,
                "The model asset could not be opened."
            )
        }

        val payload = try {
            JSONObject(jsonText)
        } catch (error: JSONException) {
            return failure(ClassifierLoadStatus.MODEL_PARSE_FAILED, error)
        }

        return try {
            val classifier = OfflineSmsClassifier.fromJson(payload)
            classifier.verifyReady()
            ClassifierLoadResult(
                status = ClassifierLoadStatus.CLASSIFIER_READY,
                classifier = classifier
            )
        } catch (error: JSONException) {
            if (error.message?.contains("Unsupported model version") == true) {
                failure(ClassifierLoadStatus.MODEL_VERSION_UNSUPPORTED, error)
            } else {
                failure(ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED, error)
            }
        } catch (error: Throwable) {
            failure(ClassifierLoadStatus.CLASSIFIER_INITIALIZATION_FAILED, error)
        }
    }

    private fun failure(
        status: ClassifierLoadStatus,
        error: Throwable,
        detail: String? = null
    ): ClassifierLoadResult = ClassifierLoadResult(
        status = status,
        error = error,
        detail = detail ?: error.message?.take(DEFAULT_DETAIL_LENGTH)
    )

    private const val DEFAULT_DETAIL_LENGTH = 200
}

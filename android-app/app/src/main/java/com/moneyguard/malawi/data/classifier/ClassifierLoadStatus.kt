package com.moneyguard.malawi.data.classifier

/**
 * Stable, user-visible reasons why the bundled offline model is or is not ready.
 * These values are also used in Logcat so a device log identifies the exact cause.
 */
enum class ClassifierLoadStatus(
    val code: String,
    val message: String
) {
    CLASSIFIER_READY(
        "CLASSIFIER_READY",
        "The offline classifier is ready."
    ),
    MODEL_ASSET_MISSING(
        "MODEL_ASSET_MISSING",
        "The bundled model file is missing from this installed app."
    ),
    MODEL_PARSE_FAILED(
        "MODEL_PARSE_FAILED",
        "The bundled model file is not valid JSON."
    ),
    MODEL_VERSION_UNSUPPORTED(
        "MODEL_VERSION_UNSUPPORTED",
        "This app does not support the version of the bundled model."
    ),
    CLASSIFIER_INITIALIZATION_FAILED(
        "CLASSIFIER_INITIALIZATION_FAILED",
        "The offline classifier could not be initialized on this device."
    )
}

data class ClassifierLoadResult(
    val status: ClassifierLoadStatus,
    val classifier: OfflineSmsClassifier? = null,
    val error: Throwable? = null,
    val detail: String? = null
) {
    val isReady: Boolean
        get() = status == ClassifierLoadStatus.CLASSIFIER_READY && classifier != null

    fun userMessage(): String = buildString {
        append(status.message)
        if (!detail.isNullOrBlank()) {
            append(' ')
            append(detail)
        }
    }
}

package com.moneyguard.malawi.domain.model

/**
 * Classification values returned by the on-device model.
 */
enum class DetectionClassification(val label: String) {
    FRAUDULENT("FRAUD"),
    LEGITIMATE("NORMAL"),
    NOT_ANALYSED("NOT ANALYSED")
}

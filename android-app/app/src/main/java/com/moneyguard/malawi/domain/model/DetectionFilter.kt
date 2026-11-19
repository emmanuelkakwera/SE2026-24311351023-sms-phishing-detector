package com.moneyguard.malawi.domain.model

/**
 * History filters shown on the Detection History screen.
 */
enum class DetectionFilter(val label: String) {
    ALL("All"),
    FRAUDULENT("Fraudulent"),
    NORMAL("Normal");

    fun matches(record: DetectionRecord): Boolean = when (this) {
        ALL -> true
        FRAUDULENT -> record.classification == DetectionClassification.FRAUDULENT
        NORMAL -> record.classification == DetectionClassification.LEGITIMATE
    }
}

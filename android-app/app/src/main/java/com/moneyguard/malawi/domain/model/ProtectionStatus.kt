package com.moneyguard.malawi.domain.model

enum class ProtectionStatus(val label: String) {
    NOT_CONFIGURED("PROTECTION NOT CONFIGURED"),
    INACTIVE("PROTECTION INACTIVE"),
    ALERTS_BLOCKED("MONITORING ON · ALERTS BLOCKED"),
    ACTIVE("PROTECTION ACTIVE")
}

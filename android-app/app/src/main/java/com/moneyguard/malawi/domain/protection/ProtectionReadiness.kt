package com.moneyguard.malawi.domain.protection

/**
 * The components that must be operational before MoneyGuard may claim that
 * protection is enabled. This is deliberately a pure function so the exact
 * same rules can be verified by local unit tests.
 */
enum class ProtectionBlocker {
    SMS_PERMISSION,
    NOTIFICATION_PERMISSION,
    MODEL_UNAVAILABLE,
    RECEIVER_NOT_CONFIGURED
}

data class ProtectionReadiness(
    val canEnable: Boolean,
    val blockers: List<ProtectionBlocker>
) {
    val explanation: String
        get() = if (blockers.isEmpty()) {
            "All required components are available."
        } else {
            "Protection cannot be enabled: " + blockers.joinToString("; ") { it.description } + "."
        }

    private val ProtectionBlocker.description: String
        get() = when (this) {
            ProtectionBlocker.SMS_PERMISSION ->
                "SMS permission has not been granted"

            ProtectionBlocker.NOTIFICATION_PERMISSION ->
                "notification permission is blocked (fraud warnings cannot be shown)"

            ProtectionBlocker.MODEL_UNAVAILABLE ->
                "the offline classification model is unavailable"

            ProtectionBlocker.RECEIVER_NOT_CONFIGURED ->
                "the incoming-SMS receiver is not configured"
        }
}

fun evaluateProtectionReadiness(
    smsPermissionGranted: Boolean,
    notificationPermissionGranted: Boolean,
    modelReady: Boolean,
    receiverConfigured: Boolean
): ProtectionReadiness {
    val blockers = buildList {
        if (!smsPermissionGranted) add(ProtectionBlocker.SMS_PERMISSION)
        if (!notificationPermissionGranted) add(ProtectionBlocker.NOTIFICATION_PERMISSION)
        if (!modelReady) add(ProtectionBlocker.MODEL_UNAVAILABLE)
        if (!receiverConfigured) add(ProtectionBlocker.RECEIVER_NOT_CONFIGURED)
    }
    return ProtectionReadiness(
        canEnable = blockers.isEmpty(),
        blockers = blockers
    )
}

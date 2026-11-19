package com.moneyguard.malawi.ui.navigation

/**
 * Single source of truth for navigation routes.
 */
object Routes {
    const val HOME = "home"
    const val HISTORY = "history"
    const val SETTINGS = "settings"

    const val DETECTION_ID_ARG = "detectionId"
    const val DETECTION_DETAILS = "detection/{$DETECTION_ID_ARG}"

    val mainTabs = setOf(HOME, HISTORY, SETTINGS)

    fun detectionDetails(id: String): String = "detection/$id"
}

package com.moneyguard.malawi.data.protection

import android.content.Context

class ProtectionPreferences(context: Context) {
    private val preferences = context.applicationContext.getSharedPreferences(
        PREFERENCES_NAME,
        Context.MODE_PRIVATE
    )

    fun isMonitoringEnabled(): Boolean =
        preferences.getBoolean(KEY_MONITORING_ENABLED, false)

    fun setMonitoringEnabled(enabled: Boolean) {
        preferences.edit().putBoolean(KEY_MONITORING_ENABLED, enabled).apply()
    }

    private companion object {
        const val PREFERENCES_NAME = "moneyguard_protection"
        const val KEY_MONITORING_ENABLED = "monitoring_enabled"
    }
}

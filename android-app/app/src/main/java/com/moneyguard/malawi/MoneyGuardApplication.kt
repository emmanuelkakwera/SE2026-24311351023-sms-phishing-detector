package com.moneyguard.malawi

import android.app.Application
import android.util.Log
import com.moneyguard.malawi.data.classifier.ClassifierLoadStatus
import com.moneyguard.malawi.notifications.DetectionNotificationHelper

class MoneyGuardApplication : Application() {
    val container: AppContainer by lazy { AppContainer(this) }

    override fun onCreate() {
        super.onCreate()
        DetectionNotificationHelper.createChannel(this)

        // Force the one-time model load at startup so failures are logged once
        // with a precise code instead of surfacing later as a generic UI error.
        val result = container.classifierLoadResult
        if (result.status == ClassifierLoadStatus.CLASSIFIER_READY) {
            Log.i(TAG, "Offline classifier initialized (CLASSIFIER_READY).")
        } else if (BuildConfig.DEBUG) {
            Log.e(
                TAG,
                "Offline classifier initialization failed: ${result.status.code}. ${result.userMessage()}",
                result.error
            )
        }
    }

    private companion object {
        const val TAG = "MoneyGuardStartup"
    }
}

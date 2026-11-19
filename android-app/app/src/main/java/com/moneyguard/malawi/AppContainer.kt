package com.moneyguard.malawi

import android.content.Context
import com.moneyguard.malawi.data.classifier.ClassifierLoadResult
import com.moneyguard.malawi.data.classifier.OfflineModelLoader
import com.moneyguard.malawi.data.detection.DetectionRepository
import com.moneyguard.malawi.data.local.MoneyGuardDatabase
import com.moneyguard.malawi.data.local.RoomDetectionRepository
import com.moneyguard.malawi.data.protection.ProtectionPreferences
import com.moneyguard.malawi.receiver.SmsDeduplicationCache

/**
 * Application-wide dependencies.
 */
class AppContainer(context: Context) {
    val applicationContext = context.applicationContext
    val database = MoneyGuardDatabase.getInstance(context)
    val detectionRepository: DetectionRepository =
        RoomDetectionRepository(database.detectionDao())
    val protectionPreferences = ProtectionPreferences(context)
    val smsDeduplicationCache = SmsDeduplicationCache(context)
    /** Loaded once when the container is created, never recreated per screen. */
    val classifierLoadResult: ClassifierLoadResult = OfflineModelLoader.load(context)
}

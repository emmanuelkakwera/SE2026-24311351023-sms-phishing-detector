package com.moneyguard.malawi.receiver

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.moneyguard.malawi.MoneyGuardApplication
import com.moneyguard.malawi.notifications.DetectionNotificationHelper

/**
 * Restores the notification channel after a restart and makes sure protection
 * is not reported as enabled when a prerequisite (for example SMS permission)
 * was revoked while the device was off.
 *
 * The SMS receiver itself is declared in the manifest, so it is re-registered
 * by Android after boot without any extra work. Monitoring continues using the
 * persisted protection setting once the device is unlocked.
 */
class BootRecoveryReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) return

        DetectionNotificationHelper.createChannel(context)

        val application = context.applicationContext as? MoneyGuardApplication ?: return
        val preferences = application.container.protectionPreferences
        if (!preferences.isMonitoringEnabled()) return

        val smsGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED
        if (!smsGranted) {
            preferences.setMonitoringEnabled(false)
            Log.w(TAG, "SMS permission was revoked; protection disabled after restart.")
        }
    }

    private companion object {
        const val TAG = "MoneyGuardBoot"
    }
}

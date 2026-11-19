package com.moneyguard.malawi

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.moneyguard.malawi.ui.MoneyGuardApp
import com.moneyguard.malawi.ui.theme.MoneyGuardTheme

class MainActivity : ComponentActivity() {
    private var detectionId by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        detectionId = intent.getStringExtra(EXTRA_DETECTION_ID)

        val container = (application as MoneyGuardApplication).container
        setContent {
            MoneyGuardTheme {
                MoneyGuardApp(
                    container = container,
                    initialDetectionId = detectionId
                )
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        detectionId = intent.getStringExtra(EXTRA_DETECTION_ID)
    }

    companion object {
        const val EXTRA_DETECTION_ID = "com.moneyguard.malawi.DETECTION_ID"
    }
}

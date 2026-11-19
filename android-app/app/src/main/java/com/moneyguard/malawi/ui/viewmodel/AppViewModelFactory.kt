package com.moneyguard.malawi.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.moneyguard.malawi.AppContainer

/**
 * Manual dependency injection for a small project. This keeps ViewModels free
 * of Android context and makes a future Hilt/Room migration straightforward.
 */
class AppViewModelFactory(
    private val container: AppContainer
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(HomeViewModel::class.java) ->
                HomeViewModel(container.detectionRepository) as T

            modelClass.isAssignableFrom(HistoryViewModel::class.java) ->
                HistoryViewModel(container.detectionRepository) as T

            modelClass.isAssignableFrom(ProtectionViewModel::class.java) ->
                ProtectionViewModel(container) as T

            else -> throw IllegalArgumentException(
                "Unknown ViewModel class: ${modelClass.name}"
            )
        }
    }
}

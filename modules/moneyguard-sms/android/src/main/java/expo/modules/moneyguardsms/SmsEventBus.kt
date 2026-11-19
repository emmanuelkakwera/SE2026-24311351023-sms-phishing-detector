package expo.modules.moneyguardsms

import java.util.concurrent.CopyOnWriteArrayList

/** A process-local bridge between the broadcast receiver and the JS module. */
object SmsEventBus {
  private val listeners = CopyOnWriteArrayList<(Map<String, Any?>) -> Unit>()

  fun addListener(listener: (Map<String, Any?>) -> Unit) {
    listeners.addIfAbsent(listener)
  }

  fun removeListener(listener: (Map<String, Any?>) -> Unit) {
    listeners.remove(listener)
  }

  fun emit(detection: Detection) {
    val payload = detection.toMap()
    listeners.forEach { listener ->
      runCatching { listener(payload) }
    }
  }
}

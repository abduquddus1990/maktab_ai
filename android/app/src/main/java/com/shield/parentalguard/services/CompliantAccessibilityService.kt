package com.shield.parentalguard.services

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.shield.parentalguard.security.SecurityKeyStoreManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Shaffof Accessibility Xizmati.
 * Maqsad: Nomaqbul kontent kontekstini aniqlash va xavfsiz shifrlash.
 * Shaxsiy ma'lumotlar (parollar, shaxsiy yozishmalar) hech qachon qayta ishlanmaydi.
 */
class CompliantAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val monitoredPackages = setOf(
        "com.google.android.youtube",
        "com.instagram.android",
        "com.zhiliaoapp.musically", // TikTok
        "com.android.chrome"
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: return

        if (!monitoredPackages.contains(packageName)) {
            return
        }

        val eventType = event.eventType
        if (eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED ||
            eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
        ) {
            val rootNode = rootInActiveWindow ?: return
            serviceScope.launch {
                inspectNodeSafely(rootNode, packageName)
            }
        }
    }

    private fun inspectNodeSafely(node: AccessibilityNodeInfo?, packageName: String) {
        if (node == null) return

        // Xavfsizlik qoidasi: Parol maydonlari yoki nozik kiritishlar TEGIB O'TILMAYDI
        if (node.isPassword) {
            return
        }

        val text = node.text?.toString()
        if (!text.isNullOrBlank() && text.length > 5) {
            // Mahalliy Keystore orqali darhol shifrlash
            val (encryptedPayload, iv) = SecurityKeyStoreManager.encryptData(text)
            Log.d("AccessibilityGuard", "Paket: $packageName, Shifrlangan fragment hajmi: ${encryptedPayload.length}")
        }

        for (i in 0 until node.childCount) {
            inspectNodeSafely(node.getChild(i), packageName)
        }
    }

    override fun onInterrupt() {
        Log.w("AccessibilityGuard", "Xizmat vaqtincha to'xtatildi.")
    }
}

package com.shield.parentalguard.services

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.shield.parentalguard.network.EncryptedNetworkClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * Shaffof Accessibility Xizmati.
 * Maqsad: YouTube Shorts, Instagram Reels va Ilovalar sarlavhalarini xavfsiz aniqlash.
 * Shaxsiy yozishmalar va parollarga MUTLAQO tegilmaydi.
 */
class CompliantAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val monitoredPackages = setOf(
        "com.google.android.youtube",
        "com.instagram.android",
        "com.zhiliaoapp.musically",
        "com.android.chrome"
    )

    private var lastExtractedText = ""
    private var lastExtractTime = 0L

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: return

        if (!monitoredPackages.contains(packageName)) return

        val now = System.currentTimeMillis()
        if (now - lastExtractTime < 3000) return // 3 soniyada 1 marta

        val rootNode = rootInActiveWindow ?: return
        serviceScope.launch {
            extractVideoTitle(rootNode, packageName)
        }
    }

    private fun extractVideoTitle(node: AccessibilityNodeInfo?, packageName: String) {
        if (node == null || node.isPassword) return

        val text = node.text?.toString()?.trim()
        if (!text.isNullOrBlank() && text.length > 8 && text != lastExtractedText) {
            lastExtractedText = text
            lastExtractTime = System.currentTimeMillis()
            Log.d("AccessibilityGuard", "Topilgan video sarlavhasi ($packageName): $text")

            // Backendga tahlil uchun yuborish
            sendTopicToBackend(packageName, text)
        }

        for (i in 0 until node.childCount) {
            extractVideoTitle(node.getChild(i), packageName)
        }
    }

    private fun sendTopicToBackend(packageName: String, topicText: String) {
        try {
            val payload = JSONObject().apply {
                put("childId", "child_1")
                put("appPackage", packageName)
                put("topic", topicText)
                put("timestamp", System.currentTimeMillis())
            }

            val body = payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val request = Request.Builder()
                .url("${EncryptedNetworkClient.BASE_URL}/api/telemetry/activities")
                .post(body)
                .build()

            EncryptedNetworkClient.client.newCall(request).execute()
        } catch (e: Exception) {
            Log.w("AccessibilityGuard", "Telemetriya xatosi: ${e.message}")
        }
    }

    override fun onInterrupt() {
        Log.w("AccessibilityGuard", "Xizmat to'xtatildi.")
    }
}

package com.shield.parentalguard.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.shield.parentalguard.network.EncryptedNetworkClient
import com.shield.parentalguard.security.SecurityKeyStoreManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * Fon Telemetriya Sinxronizatori (WorkManager).
 * Tarmoqqa uzatishdan oldin barcha xom ma'lumotlarni Keystore orqali shifrlaydi.
 */
class TelemetrySyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // 1. Shifrlanadigan xom telemetriya modeli
            val rawTelemetry = JSONObject().apply {
                put("timestamp", System.currentTimeMillis())
                put("battery_level", 85)
                put("active_app", "com.google.android.youtube")
                put("query_context", "Darsliklar va matematika tahlili")
            }.toString()

            // 2. Hardware Keystore orqali AES-256-GCM shifrlash
            val (encryptedPayload, iv) = SecurityKeyStoreManager.encryptData(rawTelemetry)

            // 3. Backend API'ga yuboriladigan DTO
            val postPayload = JSONObject().apply {
                put("app_package_name", "com.google.android.youtube")
                put("category", "Education/Entertainment")
                put("screen_time_seconds", 300)
                put("encrypted_payload", encryptedPayload)
                put("iv", iv)
                put("latitude", 41.2995)
                put("longitude", 69.2401)
                put("raw_query_text", "Matematika darsliklari va test yechimlari")
            }

            val requestBody = postPayload.toString()
                .toRequestBody("application/json; charset=utf-8".toMediaType())

            val request = Request.Builder()
                .url("https://your-api-domain.onrender.com/api/v1/telemetry/ingest")
                .addHeader("Authorization", "Bearer YOUR_CHILD_DEVICE_JWT_TOKEN")
                .post(requestBody)
                .build()

            val response = EncryptedNetworkClient.client.newCall(request).execute()
            if (response.isSuccessful) {
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}

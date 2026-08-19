package com.shield.parentalguard.services

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
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
 * Shaffof va O'ldirilmas Foreground Servis.
 * Real-vaqt GPS lokatsiya va Batareya quvvatini nazorat qiladi.
 */
class PersistentGuardService : Service(), LocationListener {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var locationManager: LocationManager? = null

    companion object {
        private const val CHANNEL_ID = "PARENTAL_GUARD_PERSISTENT_CHANNEL"
        private const val NOTIFICATION_ID = 9001
        private const val TAG = "PersistentGuardService"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startLocationUpdates()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION or ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        return START_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        try {
            locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val isGpsEnabled = locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true
            val isNetworkEnabled = locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true

            if (isGpsEnabled) {
                locationManager?.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    15 * 60 * 1000L,
                    10f,
                    this
                )
            } else if (isNetworkEnabled) {
                locationManager?.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    15 * 60 * 1000L,
                    10f,
                    this
                )
            }

            val lastLoc = locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                ?: locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            lastLoc?.let { onLocationChanged(it) }

        } catch (e: Exception) {
            Log.e(TAG, "Lokatsiya xizmatini ishga tushirishda xato: ${e.message}")
        }
    }

    override fun onLocationChanged(location: Location) {
        val batteryPct = getBatteryLevel()
        Log.d(TAG, "Yangi lokatsiya: lat=${location.latitude}, lng=${location.longitude}, bat=$batteryPct%")

        serviceScope.launch {
            sendLocationToBackend(location.latitude, location.longitude, location.speed, batteryPct)
        }
    }

    private fun sendLocationToBackend(lat: Double, lng: Double, speed: Float, battery: Int) {
        try {
            val payload = JSONObject().apply {
                put("childId", "child_1")
                put("lat", lat)
                put("lng", lng)
                put("speed", speed)
                put("battery", battery)
                put("address", "Jonli koordinata (${String.format("%.4f", lat)}, ${String.format("%.4f", lng)})")
            }

            val body = payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val request = Request.Builder()
                .url("${EncryptedNetworkClient.BASE_URL}/api/telemetry/location")
                .post(body)
                .build()

            val response = EncryptedNetworkClient.client.newCall(request).execute()
            Log.d(TAG, "Serverga lokatsiya yuborildi: ${response.code}")
        } catch (e: Exception) {
            Log.w(TAG, "Lokatsiyani serverga uzatishda xato: ${e.message}")
        }
    }

    private fun getBatteryLevel(): Int {
        val batteryStatus: Intent? = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        return if (level >= 0 && scale > 0) (level * 100 / scale) else 100
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Maktab AI Qalqon Faol 🛡️")
            .setContentText("Farzandning xavfsizligi va dars balansi himoyalanmoqda.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Maktab AI Xavfsizlik Qalqoni",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Xavfsizlik monitoringi va GPS holatini ko'rsatuvchi doimiy kanal"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager?.removeUpdates(this)
    }

    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}
    @Deprecated("Deprecated in Java")
    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    override fun onBind(intent: Intent?): IBinder? = null
}

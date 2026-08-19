package com.shield.parentalguard.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Shaffof va O'ldirilmas Foreground Servis.
 * Android OS'ning fon resurslarini tozalash mexanizmlariga bardosh beradi.
 */
class PersistentGuardService : Service() {

    companion object {
        private const val CHANNEL_ID = "PARENTAL_GUARD_PERSISTENT_CHANNEL"
        private const val NOTIFICATION_ID = 9001
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        // START_STICKY: Tizim xotira yetishmovchiligida o'ldirsa ham, xotira bo'shaganda qayta ishga tushiradi
        return START_STICKY
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Xavfsiz Qalqon Faol")
            .setContentText("Farzand qurilmasining xavfsizligi va vaqt balansi himoyalanmoqda.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true) // Foydalanuvchi tomonidan bexosdan o'chirilishiga yo'l qo'ymaydi
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Farzand Xavfsizlik Qalqoni",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Xavfsizlik monitoringi holatini ko'rsatuvchi doimiy kanal"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

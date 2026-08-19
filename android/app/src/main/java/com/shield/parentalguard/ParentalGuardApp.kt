package com.shield.parentalguard

import android.app.Application
import android.content.Intent
import android.os.Build
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.shield.parentalguard.services.PersistentGuardService
import com.shield.parentalguard.workers.TelemetrySyncWorker
import java.util.concurrent.TimeUnit

class ParentalGuardApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // 1. Doimiy Foreground Service'ni ishga tushirish
        startPersistentGuard()

        // 2. WorkManager fon sinxronizatorini jadvalga qo'yish (Har 15 daqiqada)
        schedulePeriodicTelemetrySync()
    }

    private fun startPersistentGuard() {
        val serviceIntent = Intent(this, PersistentGuardService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    private fun schedulePeriodicTelemetrySync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<TelemetrySyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "TelemetrySyncWork",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
}

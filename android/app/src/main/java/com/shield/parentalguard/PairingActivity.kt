package com.shield.parentalguard

import android.app.Activity
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.shield.parentalguard.services.PersistentGuardService

/**
 * SHIELD PARENTAL GUARD — ANDROID CLIENT ONBOARDING & PAIRING ACTIVITY
 * Поддерживает узбекский и русский языки.
 * Автоматическая привязка к родительскому аккаунту без участия администратора.
 */
class PairingActivity : Activity() {

    private lateinit var prefs: SharedPreferences
    private lateinit var etPairingCode: EditText
    private lateinit var btnPair: Button
    private lateinit var layoutPermissions: LinearLayout
    private lateinit var layoutStatus: LinearLayout
    private lateinit var tvStatusText: TextView
    private lateinit var btnGrantLocation: Button
    private lateinit var btnGrantUsage: Button
    private lateinit var btnGrantAccessibility: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pairing)

        prefs = getSharedPreferences("shield_guard_prefs", Context.MODE_PRIVATE)

        initViews()
        checkExistingPairing()
    }

    private fun initViews() {
        etPairingCode = findViewById(R.id.etPairingCode)
        btnPair = findViewById(R.id.btnPair)
        layoutPermissions = findViewById(R.id.layoutPermissions)
        layoutStatus = findViewById(R.id.layoutStatus)
        tvStatusText = findViewById(R.id.tvStatusText)
        btnGrantLocation = findViewById(R.id.btnGrantLocation)
        btnGrantUsage = findViewById(R.id.btnGrantUsage)
        btnGrantAccessibility = findViewById(R.id.btnGrantAccessibility)

        btnPair.setOnClickListener {
            val code = etPairingCode.text.toString().trim().uppercase()
            if (code.length >= 4) {
                savePairingCode(code)
            } else {
                Toast.makeText(this, "Kodni to'liq kiriting / Введите полный код", Toast.LENGTH_SHORT).show()
            }
        }

        btnGrantLocation.setOnClickListener { requestLocationPermission() }
        btnGrantUsage.setOnClickListener { requestUsageStatsPermission() }
        btnGrantAccessibility.setOnClickListener { requestAccessibilityPermission() }
    }

    private fun checkExistingPairing() {
        val savedCode = prefs.getString("family_code", null)
        if (!savedCode.isNullOrEmpty()) {
            showPermissionsOrActiveState()
        }
    }

    private fun savePairingCode(code: String) {
        prefs.edit().putString("family_code", code).putBoolean("is_paired", true).apply()
        Toast.makeText(this, "✅ Oila kodi saqlandi! / Код семьи сохранен!", Toast.LENGTH_LONG).show()
        showPermissionsOrActiveState()
    }

    private fun showPermissionsOrActiveState() {
        findViewById<LinearLayout>(R.id.layoutCodeInput).visibility = View.GONE
        layoutPermissions.visibility = View.VISIBLE

        val hasLocation = ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasUsage = checkUsageStatsPermission()

        btnGrantLocation.isEnabled = !hasLocation
        btnGrantLocation.text = if (hasLocation) "✅ Lokatsiya faol / Локация включена" else "📍 1. Lokatsiyaga ruxsat / Разрешить локацию"

        btnGrantUsage.isEnabled = !hasUsage
        btnGrantUsage.text = if (hasUsage) "✅ Ekran vaqti faol / Экранное время активно" else "📱 2. Foydalanish ruxsati / Доступ к использованию"

        if (hasLocation && hasUsage) {
            layoutPermissions.visibility = View.GONE
            layoutStatus.visibility = View.VISIBLE
            tvStatusText.text = "🛡️ Qurilma himoyalangan va ulangan!\nУстройство защищено и подключено!"
            
            // Xizmatni fonda ishga tushirish
            startGuardService()
        }
    }

    private fun requestLocationPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                android.Manifest.permission.ACCESS_FINE_LOCATION,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            1001
        )
    }

    private fun checkUsageStatsPermission(): Boolean {
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), packageName)
        } else {
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun requestUsageStatsPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        startActivity(intent)
    }

    private fun requestAccessibilityPermission() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivity(intent)
    }

    private fun startGuardService() {
        val serviceIntent = Intent(this, PersistentGuardService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onResume() {
        super.onResume()
        if (prefs.getBoolean("is_paired", false)) {
            showPermissionsOrActiveState()
        }
    }
}

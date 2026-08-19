package com.shield.parentalguard.network

import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.TlsVersion
import java.util.Collections
import java.util.concurrent.TimeUnit

object EncryptedNetworkClient {

    // Server bazaviy URL (Production yoki Lokal test: Android Emulator uchun 10.0.2.2)
    const val BASE_URL = "http://10.0.2.2:3000"

    private val modernTlsSpec = ConnectionSpec.Builder(ConnectionSpec.CLEARTEXT)
        .build()

    val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
}

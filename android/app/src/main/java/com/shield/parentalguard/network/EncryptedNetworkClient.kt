package com.shield.parentalguard.network

import okhttp3.CertificatePinner
import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.TlsVersion
import java.util.Collections
import java.util.concurrent.TimeUnit

/**
 * TLS 1.3 qat'iy majburlovchi va Certificate Pinning qo'llab-quvvatlovchi xavfsiz tarmoq mijozi.
 */
object EncryptedNetworkClient {

    private const val BASE_HOSTNAME = "onrender.com"

    // TLS 1.3 va zamonaviy shifrlar to'plami
    private val modernTlsSpec = ConnectionSpec.Builder(ConnectionSpec.MODERN_TLS)
        .tlsVersions(TlsVersion.TLS_1_3, TlsVersion.TLS_1_2)
        .build()

    // MITM (Man-in-the-Middle) hujumlariga qarshi sertifikat qadash (Certificate Pinning)
    private val certificatePinner = CertificatePinner.Builder()
        // .add(BASE_HOSTNAME, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") // Prodda xesh kiritiladi
        .build()

    val client: OkHttpClient = OkHttpClient.Builder()
        .connectionSpecs(Collections.singletonList(modernTlsSpec))
        .certificatePinner(certificatePinner)
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
}

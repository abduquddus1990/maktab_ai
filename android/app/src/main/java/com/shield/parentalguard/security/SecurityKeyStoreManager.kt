package com.shield.parentalguard.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Android Keystore TEE/SE Apparat Moduli bilan integratsiya.
 * AES-256-GCM authenticated encryption ta'minlaydi.
 */
object SecurityKeyStoreManager {

    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val KEY_ALIAS = "ParentalGuard_HardwareKey_v1"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val GCM_TAG_LENGTH = 128

    init {
        generateOrGetSecretKey()
    }

    @Synchronized
    private fun generateOrGetSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE
            )
            val parameterSpec = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            ).apply {
                setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                setKeySize(256)
                setUserAuthenticationRequired(false) // Avtonom fon xizmatlari uchun
                setRandomizedEncryptionRequired(true)
            }.build()

            keyGenerator.init(parameterSpec)
            return keyGenerator.generateKey()
        }
        return (keyStore.getEntry(KEY_ALIAS, null) as KeyStore.SecretKeyEntry).secretKey
    }

    /**
     * Matn yoki telemetriyani apparat darajasida AES-256-GCM bilan shifrlash
     * @return Pair(CiphertextBase64, IvBase64)
     */
    fun encryptData(plainText: String): Pair<String, String> {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, generateOrGetSecretKey())
        val iv = cipher.iv
        val encryption = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))

        return Pair(
            Base64.encodeToString(encryption, Base64.NO_WRAP),
            Base64.encodeToString(iv, Base64.NO_WRAP)
        )
    }

    /**
     * Shifrlangan ma'lumotni ochish
     */
    fun decryptData(encryptedBase64: String, ivBase64: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        val spec = GCMParameterSpec(GCM_TAG_LENGTH, Base64.decode(ivBase64, Base64.NO_WRAP))
        cipher.init(Cipher.DECRYPT_MODE, generateOrGetSecretKey(), spec)
        val decoded = cipher.doFinal(Base64.decode(encryptedBase64, Base64.NO_WRAP))
        return String(decoded, Charsets.UTF_8)
    }
}

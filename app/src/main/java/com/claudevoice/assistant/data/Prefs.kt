package com.claudevoice.assistant.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * All values are stored in an encrypted, on-device-only preferences file.
 * Nothing here is ever transmitted anywhere except the API key itself,
 * which goes to api.anthropic.com as an auth header when you send a message.
 */
class Prefs(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sp = EncryptedSharedPreferences.create(
        context,
        "claude_voice_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    var apiKey: String
        get() = sp.getString(KEY_API_KEY, "") ?: ""
        set(value) = sp.edit().putString(KEY_API_KEY, value).apply()

    var model: String
        get() = sp.getString(KEY_MODEL, DEFAULT_MODEL) ?: DEFAULT_MODEL
        set(value) = sp.edit().putString(KEY_MODEL, value).apply()

    var autoSpeak: Boolean
        get() = sp.getBoolean(KEY_AUTO_SPEAK, true)
        set(value) = sp.edit().putBoolean(KEY_AUTO_SPEAK, value).apply()

    var speechRate: Float
        get() = sp.getFloat(KEY_SPEECH_RATE, 1.0f)
        set(value) = sp.edit().putFloat(KEY_SPEECH_RATE, value).apply()

    var backgroundServiceEnabled: Boolean
        get() = sp.getBoolean(KEY_BACKGROUND_SERVICE, true)
        set(value) = sp.edit().putBoolean(KEY_BACKGROUND_SERVICE, value).apply()

    companion object {
        private const val KEY_API_KEY = "api_key"
        private const val KEY_MODEL = "model"
        private const val KEY_AUTO_SPEAK = "auto_speak"
        private const val KEY_SPEECH_RATE = "speech_rate"
        private const val KEY_BACKGROUND_SERVICE = "background_service_enabled"
        const val DEFAULT_MODEL = "claude-sonnet-5"
    }
}

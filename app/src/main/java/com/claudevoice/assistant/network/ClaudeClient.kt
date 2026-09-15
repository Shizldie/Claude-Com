package com.claudevoice.assistant.network

import com.claudevoice.assistant.data.ChatMessage
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Minimal client for the Anthropic Messages API. Deliberately dependency-free
 * (HttpURLConnection + org.json, both built into Android) to keep the app small.
 * Must be called off the main thread.
 */
object ClaudeClient {

    private const val ENDPOINT = "https://api.anthropic.com/v1/messages"
    private const val ANTHROPIC_VERSION = "2023-06-01"
    private const val MAX_TOKENS = 1024

    class ClaudeApiException(message: String) : Exception(message)

    fun sendMessage(
        apiKey: String,
        model: String,
        history: List<ChatMessage>,
        systemPrompt: String? = null
    ): String {
        if (apiKey.isBlank()) {
            throw ClaudeApiException("No API key set. Open Settings and add your Anthropic API key.")
        }

        val connection = URL(ENDPOINT).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.setRequestProperty("x-api-key", apiKey)
            connection.setRequestProperty("anthropic-version", ANTHROPIC_VERSION)
            connection.setRequestProperty("content-type", "application/json")
            connection.doOutput = true
            connection.connectTimeout = 20_000
            connection.readTimeout = 60_000

            val messagesArray = JSONArray()
            for (msg in history) {
                messagesArray.put(
                    JSONObject()
                        .put("role", msg.role)
                        .put("content", msg.text)
                )
            }

            val body = JSONObject()
                .put("model", model)
                .put("max_tokens", MAX_TOKENS)
                .put("messages", messagesArray)
            if (!systemPrompt.isNullOrBlank()) {
                body.put("system", systemPrompt)
            }

            OutputStreamWriter(connection.outputStream).use { it.write(body.toString()) }

            val responseCode = connection.responseCode
            val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
            val responseText = BufferedReader(InputStreamReader(stream)).use { it.readText() }

            if (responseCode !in 200..299) {
                val errorMsg = runCatching {
                    JSONObject(responseText).optJSONObject("error")?.optString("message")
                }.getOrNull()
                throw ClaudeApiException(errorMsg ?: "Claude API error ($responseCode)")
            }

            val json = JSONObject(responseText)
            val contentArray = json.optJSONArray("content") ?: JSONArray()
            val sb = StringBuilder()
            for (i in 0 until contentArray.length()) {
                val block = contentArray.getJSONObject(i)
                if (block.optString("type") == "text") {
                    sb.append(block.optString("text"))
                }
            }
            return sb.toString().ifBlank { "(no response)" }
        } finally {
            connection.disconnect()
        }
    }
}

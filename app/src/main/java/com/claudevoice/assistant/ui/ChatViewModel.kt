package com.claudevoice.assistant.ui

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.claudevoice.assistant.data.ChatMessage
import com.claudevoice.assistant.data.Prefs
import com.claudevoice.assistant.network.ClaudeClient
import com.claudevoice.assistant.tools.CallLogReader
import com.claudevoice.assistant.tools.CommandRouter
import com.claudevoice.assistant.tools.ContactCaller
import com.claudevoice.assistant.tools.FileReader
import com.claudevoice.assistant.tools.RoutedCommand
import com.claudevoice.assistant.voice.TextToSpeechEngine
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class PendingCall(val displayName: String, val phoneNumber: String)

class ChatViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = Prefs(application)
    private val tts = TextToSpeechEngine(application)

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _isThinking = MutableStateFlow(false)
    val isThinking: StateFlow<Boolean> = _isThinking.asStateFlow()

    private val _pendingCall = MutableStateFlow<PendingCall?>(null)
    val pendingCall: StateFlow<PendingCall?> = _pendingCall.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        tts.setRate(prefs.speechRate)
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun dismissPendingCall() {
        _pendingCall.value = null
    }

    fun submitUserInput(rawText: String) {
        if (rawText.isBlank()) return
        val context = getApplication<Application>()
        appendMessage(ChatMessage("user", rawText))

        when (val routed = CommandRouter.route(rawText)) {
            is RoutedCommand.CallContact -> handleCallContact(context, routed.name)
            is RoutedCommand.ReadFile -> handleReadFile(routed.fileName)
            is RoutedCommand.RecentCalls -> handleRecentCalls(context)
            is RoutedCommand.Chat -> queryClaude(rawText)
        }
    }

    private fun handleCallContact(context: Context, name: String) {
        val contact = ContactCaller.findContact(context, name)
        val reply = if (contact == null) {
            "I couldn't find a contact matching \"$name\"."
        } else {
            _pendingCall.value = PendingCall(contact.name, contact.phoneNumber)
            "Found ${contact.name}. Tap confirm to place the call."
        }
        appendMessage(ChatMessage("assistant", reply))
        speakIfEnabled(reply)
    }

    private fun handleReadFile(fileName: String) {
        viewModelScope.launch {
            _isThinking.value = true
            val content = withContext(Dispatchers.IO) { FileReader.findAndRead(fileName) }
            _isThinking.value = false
            if (content == null) {
                val reply = "I couldn't find a readable text file matching \"$fileName\" on this device."
                appendMessage(ChatMessage("assistant", reply))
                speakIfEnabled(reply)
            } else {
                queryClaude(
                    "The user asked to read the file \"$fileName\". Its contents:\n\n$content\n\n" +
                        "Summarize it or answer their question about it."
                )
            }
        }
    }

    private fun handleRecentCalls(context: Context) {
        val log = CallLogReader.recentCalls(context)
        queryClaude(
            "Here is the user's recent call log:\n\n$log\n\n" +
                "Answer their question or summarize it naturally, as if you already knew this."
        )
    }

    private fun queryClaude(promptForModel: String) {
        _isThinking.value = true
        viewModelScope.launch {
            try {
                val history = _messages.value.dropLast(1).takeLast(19) + ChatMessage("user", promptForModel)
                val reply = withContext(Dispatchers.IO) {
                    ClaudeClient.sendMessage(
                        apiKey = prefs.apiKey,
                        model = prefs.model,
                        history = history
                    )
                }
                appendMessage(ChatMessage("assistant", reply))
                speakIfEnabled(reply)
            } catch (e: Exception) {
                _errorMessage.value = e.message ?: "Something went wrong."
            } finally {
                _isThinking.value = false
            }
        }
    }

    private fun appendMessage(message: ChatMessage) {
        _messages.value = _messages.value + message
    }

    private fun speakIfEnabled(text: String) {
        if (prefs.autoSpeak) tts.speak(text)
    }

    fun stopSpeaking() = tts.stop()

    override fun onCleared() {
        tts.shutdown()
        super.onCleared()
    }
}

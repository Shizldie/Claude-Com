package com.claudevoice.assistant.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.claudevoice.assistant.ui.theme.ClaudeVoiceTheme

class SettingsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ClaudeVoiceTheme {
                SettingsScreen(onBack = { finish() })
            }
        }
    }
}

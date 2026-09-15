package com.claudevoice.assistant.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.claudevoice.assistant.data.Prefs
import com.claudevoice.assistant.service.ChatBackgroundService

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val prefs = remember { Prefs(context) }

    var apiKey by remember { mutableStateOf(prefs.apiKey) }
    var model by remember { mutableStateOf(prefs.model) }
    var autoSpeak by remember { mutableStateOf(prefs.autoSpeak) }
    var speechRate by remember { mutableFloatStateOf(prefs.speechRate) }
    var backgroundServiceEnabled by remember { mutableStateOf(prefs.backgroundServiceEnabled) }
    var showKey by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    TextButton(onClick = onBack) { Text("Done") }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Anthropic API Key", style = MaterialTheme.typography.labelLarge)
            OutlinedTextField(
                value = apiKey,
                onValueChange = {
                    apiKey = it
                    prefs.apiKey = it
                },
                visualTransformation = if (showKey) VisualTransformation.None else PasswordVisualTransformation(),
                trailingIcon = {
                    TextButton(onClick = { showKey = !showKey }) { Text(if (showKey) "Hide" else "Show") }
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Text(
                "Stored encrypted, on-device only. Get a key at console.anthropic.com.",
                style = MaterialTheme.typography.bodySmall
            )

            Text("Model", style = MaterialTheme.typography.labelLarge)
            OutlinedTextField(
                value = model,
                onValueChange = {
                    model = it
                    prefs.model = it
                },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Speak replies aloud", modifier = Modifier.weight(1f))
                Switch(
                    checked = autoSpeak,
                    onCheckedChange = {
                        autoSpeak = it
                        prefs.autoSpeak = it
                    }
                )
            }

            Text("Speech rate: ${"%.1f".format(speechRate)}x", style = MaterialTheme.typography.labelLarge)
            Slider(
                value = speechRate,
                onValueChange = {
                    speechRate = it
                    prefs.speechRate = it
                },
                valueRange = 0.5f..2.0f
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Keep running in background")
                    Text(
                        "Shows a persistent notification so the app stays alive when you switch away.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                Switch(
                    checked = backgroundServiceEnabled,
                    onCheckedChange = { enabled ->
                        backgroundServiceEnabled = enabled
                        prefs.backgroundServiceEnabled = enabled
                        if (enabled) {
                            ChatBackgroundService.start(context)
                        } else {
                            ChatBackgroundService.stop(context)
                        }
                    }
                )
            }
        }
    }
}

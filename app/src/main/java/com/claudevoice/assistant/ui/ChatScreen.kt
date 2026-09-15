package com.claudevoice.assistant.ui

import android.view.MotionEvent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.claudevoice.assistant.R
import com.claudevoice.assistant.data.ChatMessage
import com.claudevoice.assistant.tools.ContactCaller
import com.claudevoice.assistant.voice.SpeechToText

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun ChatScreen(
    viewModel: ChatViewModel,
    onOpenSettings: () -> Unit,
    onOpenSessions: () -> Unit,
    onRequestMicPermission: () -> Unit,
    hasMicPermission: Boolean
) {
    val messages by viewModel.messages.collectAsState()
    val isThinking by viewModel.isThinking.collectAsState()
    val pendingCall by viewModel.pendingCall.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var inputText by remember { mutableStateOf("") }
    var isListening by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val listState = rememberLazyListState()
    val snackbarHostState = remember { SnackbarHostState() }

    val speechToText = remember {
        SpeechToText(
            context = context,
            onResult = { text ->
                isListening = false
                inputText = ""
                viewModel.submitUserInput(text)
            },
            onPartial = { partial -> inputText = partial },
            onError = { isListening = false },
            onListeningStateChanged = { listening -> isListening = listening }
        )
    }
    DisposableEffect(Unit) {
        onDispose { speechToText.destroy() }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    LaunchedEffect(errorMessage) {
        errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    pendingCall?.let { call ->
        AlertDialog(
            onDismissRequest = { viewModel.dismissPendingCall() },
            title = { Text("Call ${call.displayName}?") },
            text = { Text(call.phoneNumber) },
            confirmButton = {
                TextButton(onClick = {
                    context.startActivity(ContactCaller.callIntent(call.phoneNumber))
                    viewModel.dismissPendingCall()
                }) { Text("Call") }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissPendingCall() }) { Text("Cancel") }
            }
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Claude Companion") },
                actions = {
                    IconButton(onClick = onOpenSessions) {
                        Icon(
                            painterResource(R.drawable.ic_sessions),
                            contentDescription = "Sessions"
                        )
                    }
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Filled.Settings, contentDescription = "Settings")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages) { message -> MessageBubble(message) }
                if (isThinking) {
                    item { Text("Thinking…", modifier = Modifier.padding(8.dp)) }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text(if (isListening) "Listening…" else "Message Claude") },
                    maxLines = 4
                )
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(onClick = {
                    if (inputText.isNotBlank()) {
                        viewModel.submitUserInput(inputText)
                        inputText = ""
                    }
                }) {
                    Icon(Icons.Filled.Send, contentDescription = "Send")
                }
                Spacer(modifier = Modifier.width(4.dp))

                val micColor = if (isListening) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(micColor, shape = RoundedCornerShape(28.dp))
                        .pointerInteropFilter { event ->
                            when (event.action) {
                                MotionEvent.ACTION_DOWN -> {
                                    if (!hasMicPermission) {
                                        onRequestMicPermission()
                                    } else {
                                        inputText = ""
                                        speechToText.startListening()
                                    }
                                    true
                                }
                                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                                    speechToText.stopListening()
                                    true
                                }
                                else -> false
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        painterResource(R.drawable.ic_mic),
                        contentDescription = "Push to talk",
                        tint = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(message: ChatMessage) {
    val isUser = message.role == "user"
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Surface(
            color = if (isUser) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.secondaryContainer,
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.padding(vertical = 4.dp)
        ) {
            Text(
                text = message.text,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
            )
        }
    }
}

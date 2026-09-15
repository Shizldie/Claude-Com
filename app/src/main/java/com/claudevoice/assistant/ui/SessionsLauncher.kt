package com.claudevoice.assistant.ui

import android.content.Context
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent

/**
 * Opens your real Claude Code sessions in a Chrome Custom Tab rather than an
 * embedded WebView. This isn't a style choice: Google's own sign-in flow
 * (including "Sign in with Google") deliberately refuses to complete inside
 * an app's embedded WebView as an anti-phishing measure, which is exactly
 * the white screen you hit. A Custom Tab runs inside real Chrome, so Google
 * login (and everything after it) works normally.
 */
object SessionsLauncher {
    private const val SESSIONS_URL = "https://claude.ai/code"

    fun open(context: Context) {
        CustomTabsIntent.Builder()
            .build()
            .launchUrl(context, Uri.parse(SESSIONS_URL))
    }
}

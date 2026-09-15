package com.claudevoice.assistant.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.claudevoice.assistant.MainActivity
import com.claudevoice.assistant.R

/**
 * Keeps the process (and the chat conversation held in ChatViewModel) alive
 * while the user is out of the app, via a plain ongoing notification. No
 * background listening, no polling of anything external — it just stops the
 * OS from killing the process, and gives a one-tap way back in or to stop.
 */
class ChatBackgroundService : Service() {

    override fun onBind(intent: Intent?): Nothing? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }
        Notifications.ensureChannel(this)
        startForeground(NOTIFICATION_ID, buildNotification())
        return START_STICKY
    }

    private fun buildNotification(): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, ChatBackgroundService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, Notifications.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.background_notification_text))
            .setContentIntent(openIntent)
            .addAction(0, getString(R.string.background_notification_stop), stopIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    companion object {
        const val NOTIFICATION_ID = 42
        const val ACTION_STOP = "com.claudevoice.assistant.action.STOP_BACKGROUND"

        fun start(context: Context) {
            val intent = Intent(context, ChatBackgroundService::class.java)
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            context.startService(Intent(context, ChatBackgroundService::class.java).setAction(ACTION_STOP))
        }
    }
}

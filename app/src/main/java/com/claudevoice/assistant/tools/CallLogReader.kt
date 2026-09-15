package com.claudevoice.assistant.tools

import android.content.Context
import android.provider.CallLog
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CallLogReader {

    fun recentCalls(context: Context, limit: Int = 10): String {
        val projection = arrayOf(
            CallLog.Calls.CACHED_NAME,
            CallLog.Calls.NUMBER,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE
        )
        val sb = StringBuilder()
        val fmt = SimpleDateFormat("MMM d, h:mm a", Locale.getDefault())

        context.contentResolver.query(
            CallLog.Calls.CONTENT_URI,
            projection,
            null,
            null,
            "${CallLog.Calls.DATE} DESC"
        )?.use { cursor ->
            var count = 0
            while (cursor.moveToNext() && count < limit) {
                val name = cursor.getString(0) ?: cursor.getString(1) ?: "Unknown"
                val type = when (cursor.getInt(2)) {
                    CallLog.Calls.INCOMING_TYPE -> "incoming"
                    CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                    CallLog.Calls.MISSED_TYPE -> "missed"
                    else -> "call"
                }
                val date = fmt.format(Date(cursor.getLong(3)))
                sb.appendLine("$name - $type - $date")
                count++
            }
        }
        return if (sb.isEmpty()) "No recent calls found." else sb.toString()
    }
}

package com.claudevoice.assistant.tools

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.ContactsContract

data class ContactMatch(val name: String, val phoneNumber: String)

object ContactCaller {

    fun findContact(context: Context, name: String): ContactMatch? {
        val uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        )
        val selection = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ?"
        val selectionArgs = arrayOf("%$name%")

        context.contentResolver.query(uri, projection, selection, selectionArgs, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val displayName = cursor.getString(0) ?: name
                val number = cursor.getString(1) ?: return null
                return ContactMatch(displayName, number)
            }
        }
        return null
    }

    fun callIntent(phoneNumber: String): Intent =
        Intent(Intent.ACTION_CALL, Uri.parse("tel:$phoneNumber"))
}

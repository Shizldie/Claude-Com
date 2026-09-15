package com.claudevoice.assistant.tools

import android.os.Environment
import java.io.File

/**
 * Searches device storage (requires MANAGE_EXTERNAL_STORAGE) for a text-like
 * file matching the given name and returns its contents. Only ever invoked
 * when the user explicitly asks to read a file.
 */
object FileReader {

    private val READABLE_EXTENSIONS = setOf("txt", "md", "csv", "log", "json")
    private const val MAX_CHARS = 8000
    private const val MAX_DEPTH = 4

    fun findAndRead(fileName: String): String? {
        val root = Environment.getExternalStorageDirectory()
        val match = searchDirectory(root, fileName.lowercase(), depth = 0) ?: return null
        val text = match.readText()
        return if (text.length > MAX_CHARS) text.take(MAX_CHARS) + "\n...(truncated)" else text
    }

    private fun searchDirectory(dir: File, target: String, depth: Int): File? {
        if (depth > MAX_DEPTH) return null
        val entries = dir.listFiles() ?: return null

        for (entry in entries) {
            if (entry.isFile &&
                entry.extension.lowercase() in READABLE_EXTENSIONS &&
                entry.name.lowercase().contains(target)
            ) {
                return entry
            }
        }
        for (entry in entries) {
            if (entry.isDirectory && !entry.name.startsWith(".") && entry.name != "Android") {
                searchDirectory(entry, target, depth + 1)?.let { return it }
            }
        }
        return null
    }
}

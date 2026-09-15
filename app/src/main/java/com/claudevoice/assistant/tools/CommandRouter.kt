package com.claudevoice.assistant.tools

sealed class RoutedCommand {
    data class CallContact(val name: String) : RoutedCommand()
    data class ReadFile(val fileName: String) : RoutedCommand()
    data object RecentCalls : RoutedCommand()
    data class Chat(val text: String) : RoutedCommand()
}

/**
 * Very small, explicit intent matcher. Anything that doesn't match one of the
 * device-action patterns below is treated as plain chat and sent to Claude.
 */
object CommandRouter {

    private val callPattern = Regex("""^\s*call\s+(.+)$""", RegexOption.IGNORE_CASE)
    private val readFilePattern = Regex("""^\s*read\s+(?:the\s+)?file\s+(.+)$""", RegexOption.IGNORE_CASE)
    private val recentCallsPattern = Regex(
        """^\s*(recent calls|call log|who did i call)\s*\??\s*$""",
        RegexOption.IGNORE_CASE
    )

    fun route(input: String): RoutedCommand {
        callPattern.find(input)?.let { return RoutedCommand.CallContact(it.groupValues[1].trim()) }
        readFilePattern.find(input)?.let { return RoutedCommand.ReadFile(it.groupValues[1].trim()) }
        if (recentCallsPattern.matches(input.trim())) return RoutedCommand.RecentCalls
        return RoutedCommand.Chat(input)
    }
}

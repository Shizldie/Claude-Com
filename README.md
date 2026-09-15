# Claude Companion

A lightweight Android app for talking to Claude by voice or text: speech-to-text
input, text-to-speech replies, a push-to-talk mic button, and an optional
background service so the conversation stays alive when you switch apps.

This project was generated as complete, buildable source — it was **not**
compiled in the environment that generated it (no Android SDK / no access to
Google's SDK servers there). You build the real `.apk` yourself, see below.

## Features

- Text or voice chat with Claude (Anthropic Messages API)
- Push-to-talk: hold the mic button to record, release to send — no
  wake word, no always-on listening
- Replies spoken aloud automatically (toggle in Settings), adjustable rate
- Optional background service (Settings toggle, on by default): a persistent
  notification keeps the app process alive when you switch away, with
  "open" and "stop" actions right on the notification
- Voice commands that trigger real phone actions, always requiring an
  explicit spoken confirmation before anything irreversible happens:
  - `"call <name>"` — looks up the contact and asks you to confirm before dialing
  - `"read file <name>"` — finds a text file on the device and asks Claude
    about its contents
  - `"recent calls"` — reads back your recent call log via Claude

## Why these permissions

You asked for broad access (files, contacts, call log/state, phone), so the
manifest requests all of it up front. To keep this honest and not just a pile
of unused permissions:

| Permission | Used for |
|---|---|
| `RECORD_AUDIO` | Push-to-talk speech input |
| `INTERNET` | Talking to the Claude API |
| `READ_CONTACTS`, `CALL_PHONE` | The `"call <name>"` voice command |
| `READ_PHONE_STATE` | Required alongside call permissions on some OS versions |
| `READ_CALL_LOG` | The `"recent calls"` voice command |
| `MANAGE_EXTERNAL_STORAGE` / `READ_EXTERNAL_STORAGE` | The `"read file <name>"` voice command |
| `POST_NOTIFICATIONS` | The background-service status notification |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE` | Lets the background-keep-alive service run |

One deliberate omission: **no SMS permissions**. Nothing in the app reads or
sends text messages, and adding `READ_SMS` with no feature behind it would
just be a standing privacy liability — your own messages, and other people's
messages to you, sitting there for no reason. Say the word if you actually
want an SMS feature and I'll add it with the same explicit-confirmation
pattern as calling.

Nothing leaves the device except: (1) your API key + chat text, sent to
`api.anthropic.com` when you talk to Claude, and (2) file contents / call log
entries, but *only* when you explicitly trigger those specific commands —
never in the background, never silently.

The API key is stored in `EncryptedSharedPreferences` (AndroidX Security),
on-device only.

## Building the APK

The environment that generated this project has no Android SDK and its
network policy blocks `dl.google.com` (Google's SDK distribution host) — a
403 from the sandbox's own egress proxy, confirmed, not a bug to work around.
So this project ships as source; you build the actual `.apk` with one of the
options below. All three produce a normal debug-signed APK (signed with an
auto-generated debug key) — fine to install and use yourself, not meant for
the Play Store.

**Option A — GitHub Actions (no local install needed):** the repo includes
`.github/workflows/build-apk.yml`, which builds the APK on GitHub's own
runners (they have the Android SDK preinstalled and unrestricted internet, so
none of the above blockers apply there).
1. Push this project to a new GitHub repo (Add file → Upload files also
   works, no git experience required).
2. Go to the repo's **Actions** tab — the workflow runs automatically on
   push, or click **Run workflow** to trigger it manually.
3. When it finishes (~2-3 minutes), open the run and download the
   `claude-companion-debug-apk` artifact from the **Artifacts** section at
   the bottom of the page. Unzip it to get `app-debug.apk`.
4. Transfer that file to your phone and open it (Android will ask you to
   allow installs from whatever app you used to transfer it).

**Option B — Android Studio:** File → Open → select the `ClaudeVoice`
folder. Let it sync, then Run ▶ on a device/emulator, or Build → Build
Bundle(s) / APK(s) → Build APK(s).

**Option C — command line, with a full Android SDK already installed:**
```
cd ClaudeVoice
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`. Install with
`adb install app/build/outputs/apk/debug/app-debug.apk` or copy it to the
phone and open it (you'll need to allow "install unknown apps" for whatever
app you transfer it with).

For a release build you'll need to sign it yourself (`./gradlew
assembleRelease` plus a signing config) — debug builds install and run fine
for personal use.

## First-time setup on your phone

1. Install the APK, open the app, grant the permission prompts (and the "All
   files access" screen it opens for the file-reading feature).
2. Tap the settings gear, paste in an Anthropic API key from
   console.anthropic.com.
3. Talk or type. Hold the mic button to speak, release to send.

## Running in the background

Enabled by default (toggle it off any time in Settings). While on, you'll see
an ongoing "Claude Companion — Running in the background" notification: tap
it to reopen the app, or tap **Stop** to end the background service (the app
still works normally when opened directly, this only affects whether it
survives being swiped away / backgrounded).

This is a plain keep-alive foreground service — it does not listen for audio,
poll anything, or do any work while backgrounded. It exists only so the
process (and your conversation history) isn't killed by the OS the moment you
switch to another app.

## Project layout

```
app/src/main/java/com/claudevoice/assistant/
  MainActivity.kt              entry point, permission requests
  ui/                           Compose chat screen, settings, view model
  data/                         encrypted prefs, chat message model
  network/                      Anthropic Messages API client (no extra deps)
  voice/                        TextToSpeech + push-to-talk SpeechRecognizer wrappers
  tools/                        contact lookup, call log, file search, command router
  service/                      background keep-alive foreground service + notification
```

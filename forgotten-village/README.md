# Forgotten Village

Single-file HTML game plus a thin Android shell.

- `src/` game source, `build.sh` assembles `dist/forgotten-village.html` and `dist/version.json`
- `dist/` what the phone app downloads when you press **Settings > Updates > Check for updates**
- `android/` the app (WebView shell). Built by `.github/workflows/forgotten-village-apk.yml`

## Get the app
Actions tab > "Forgotten Village APK" > Run workflow. When it finishes, open the
**Releases** page and download `forgotten-village.apk` on your phone (allow "install unknown apps" for your browser).

## Shipping a game update
Run `./build.sh`, commit `dist/`, push. In the app: Settings (gear) > Updates > Check for updates > Download update > Restart.
GitHub's raw CDN can take a few minutes to serve a new file.

#!/bin/sh
# Builds forgotten-village.html (single file) and dist/ (the html + version.json used by the in-app updater).
cd "$(dirname "$0")"
BUILD=$(( $(date +%s) / 60 ))
LABEL=$(date -u +%Y.%m.%d-%H%M)
URL=$(cat update-url.txt 2>/dev/null | tr -d '\n' || true)
NOTES=$(cat release-notes.txt 2>/dev/null | tr '\n' ' ' | sed 's/"/\\"/g' || true)
{ cat src/shell.html; echo '<script>'; cat src/data.js src/art.js src/sim.js src/ach.js src/render.js src/ui.js src/settings.js src/main.js; echo '</script>'; } \
 | sed -e "s|__BUILD__|$BUILD|g" -e "s|__BUILD_LABEL__|$LABEL|g" -e "s|__UPDATE_URL__|$URL|g" > forgotten-village.html
mkdir -p dist
cp forgotten-village.html dist/forgotten-village.html
SHA=$(sha256sum dist/forgotten-village.html | cut -d' ' -f1)
SIZE=$(wc -c < dist/forgotten-village.html | tr -d ' ')
printf '{"build":%s,"label":"%s","file":"forgotten-village.html","size":%s,"sha256":"%s","notes":"%s"}\n' "$BUILD" "$LABEL" "$SIZE" "$SHA" "$NOTES" > dist/version.json
wc -c forgotten-village.html

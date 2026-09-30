package com.forgottenvillage.game;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Forgotten Village: a thin native shell around the HTML game.
 * The game ships inside the APK (assets/forgotten-village.html). The in-game Settings
 * screen can download a newer copy into app storage; that copy is used when it is newer.
 * Saved villages live in the WebView's localStorage, so updates never touch them.
 */
public class MainActivity extends Activity {
    private static final String BASE_ORIGIN = "https://appassets.forgottenvillage/";
    private static final String GAME_FILE = "forgotten-village.html";
    private static final String PREFS = "fv_native";

    private WebView web;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(20, 26, 16));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setLongClickable(false);
        web.setHapticFeedbackEnabled(false);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return true; // the game never navigates away
            }

            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail d) {
                runOnUiThread(() -> recreate());
                return true;
            }
        });
        setContentView(web);
        loadGame();
    }

    private File overrideFile() {
        return new File(new File(getFilesDir(), "update"), GAME_FILE);
    }

    private long bundledBuild() {
        try {
            JSONObject o = new JSONObject(readAsset("version.json"));
            return o.optLong("build", 0);
        } catch (Exception e) {
            return 0;
        }
    }

    private String readAsset(String name) throws Exception {
        try (InputStream in = getAssets().open(name)) {
            return new String(readAll(in), StandardCharsets.UTF_8);
        }
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toByteArray();
    }

    private boolean overrideActive() {
        File f = overrideFile();
        if (!f.isFile() || f.length() < 50000) return false;
        long ob = prefs.getLong("override_build", 0);
        if (ob < bundledBuild()) { // a newer APK was installed: drop the stale downloaded copy
            f.delete();
            return false;
        }
        return true;
    }

    private void loadGame() {
        String html;
        try {
            html = overrideActive()
                ? new String(readAll(new java.io.FileInputStream(overrideFile())), StandardCharsets.UTF_8)
                : readAsset(GAME_FILE);
        } catch (Exception e) {
            try { html = readAsset(GAME_FILE); } catch (Exception e2) { html = "<h3>Game files missing.</h3>"; }
        }
        web.loadDataWithBaseURL(BASE_ORIGIN, html, "text/html", "utf-8", null);
    }

    private void js(final String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideBars();
        web.onResume();
    }

    @Override
    protected void onPause() {
        js("try{saveGame()}catch(e){}");
        web.onPause();
        super.onPause();
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) hideBars();
    }

    @SuppressWarnings("deprecation")
    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        // Close an open panel first; otherwise send the game to the background instead of quitting.
        web.evaluateJavascript(
            "(function(){var s=document.getElementById('sheet');if(s&&!s.hidden){closeSheet();return 1}var c=document.getElementById('card');if(c&&!c.hidden){closeCard();return 1}return 0})()",
            value -> { if (!"1".equals(value)) moveTaskToBack(true); });
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.removeJavascriptInterface("Android"); web.destroy(); web = null; }
        super.onDestroy();
    }

    /* ---------------- JavaScript bridge (used by the Settings screen) ---------------- */
    private class Bridge {
        @JavascriptInterface
        public String info() {
            try {
                PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                JSONObject o = new JSONObject();
                o.put("app", pi.versionName);
                o.put("bundled", bundledBuild());
                o.put("override", overrideFile().isFile());
                return o.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void check(final String base) {
            new Thread(() -> {
                JSONObject r = new JSONObject();
                try {
                    JSONObject v = new JSONObject(fetchText(base + "version.json"));
                    r.put("ok", true);
                    r.put("latest", v.getLong("build"));
                    r.put("label", v.optString("label", ""));
                    r.put("notes", v.optString("notes", ""));
                } catch (Exception e) {
                    fail(r, e);
                }
                js("window.fvNative.onCheck(" + JSONObject.quote(r.toString()) + ")");
            }).start();
        }

        @JavascriptInterface
        public void apply(final String base) {
            new Thread(() -> {
                JSONObject r = new JSONObject();
                try {
                    JSONObject v = new JSONObject(fetchText(base + "version.json"));
                    String file = v.optString("file", GAME_FILE);
                    byte[] data = fetchBytes(base + file, true);
                    String want = v.optString("sha256", "");
                    MessageDigest md = MessageDigest.getInstance("SHA-256");
                    StringBuilder hex = new StringBuilder();
                    for (byte x : md.digest(data)) hex.append(String.format("%02x", x));
                    if (want.length() > 0 && !want.equalsIgnoreCase(hex.toString()))
                        throw new Exception("The download was incomplete. Try again.");
                    String head = new String(data, 0, Math.min(data.length, 4000), StandardCharsets.UTF_8);
                    if (data.length < 50000 || !head.contains("<title>"))
                        throw new Exception("That file does not look like the game.");
                    File dir = new File(getFilesDir(), "update");
                    if (!dir.isDirectory() && !dir.mkdirs()) throw new Exception("No storage space.");
                    File tmp = new File(dir, GAME_FILE + ".tmp");
                    try (FileOutputStream fo = new FileOutputStream(tmp)) { fo.write(data); }
                    File dst = overrideFile();
                    if (dst.exists()) dst.delete();
                    if (!tmp.renameTo(dst)) throw new Exception("Could not save the update.");
                    prefs.edit().putLong("override_build", v.getLong("build")).apply();
                    r.put("ok", true);
                } catch (Exception e) {
                    fail(r, e);
                }
                js("window.fvNative.onApply(" + JSONObject.quote(r.toString()) + ")");
            }).start();
        }

        @JavascriptInterface
        public void reload() {
            runOnUiThread(MainActivity.this::loadGame);
        }

        @JavascriptInterface
        public void resetUpdate() {
            overrideFile().delete();
            prefs.edit().remove("override_build").apply();
            runOnUiThread(MainActivity.this::loadGame);
        }
    }

    private static void fail(JSONObject r, Exception e) {
        try {
            r.put("ok", false);
            String m = e.getMessage();
            if (e instanceof java.net.UnknownHostException || e instanceof java.net.SocketTimeoutException
                || e instanceof java.net.ConnectException) m = "No internet connection.";
            r.put("error", m == null ? "Something went wrong." : m);
        } catch (Exception ignored) { }
    }

    private String fetchText(String url) throws Exception {
        return new String(fetchBytes(url, false), StandardCharsets.UTF_8);
    }

    private byte[] fetchBytes(String url, boolean progress) throws Exception {
        if (!url.startsWith("https://")) throw new Exception("The update address must start with https://");
        String bust = url + (url.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis();
        HttpURLConnection c = (HttpURLConnection) new URL(bust).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setRequestProperty("User-Agent", "ForgottenVillage-App");
        c.setRequestProperty("Cache-Control", "no-cache");
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new Exception("The update server answered " + code + ". Check the update address.");
            long total = c.getContentLengthLong();
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                int n, last = -1;
                long got = 0;
                while ((n = in.read(buf)) > 0) {
                    out.write(buf, 0, n);
                    got += n;
                    if (progress && total > 0) {
                        int pct = (int) (got * 100 / total);
                        if (pct != last && pct % 5 == 0) { last = pct; js("window.fvNative.onProgress(" + pct + ")"); }
                    }
                }
                return out.toByteArray();
            }
        } finally {
            c.disconnect();
        }
    }
}

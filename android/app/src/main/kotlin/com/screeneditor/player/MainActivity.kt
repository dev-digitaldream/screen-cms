package com.screeneditor.player

import android.annotation.SuppressLint
import androidx.appcompat.app.AppCompatActivity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.ConsoleMessage
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.content.pm.ActivityInfo
import androidx.core.content.FileProvider
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.io.File
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "ScreenEditor"
        const val ACTION_CONFIG_UPDATED = "com.screeneditor.player.CONFIG_UPDATED"
        const val ACTION_FORCE_RELOAD   = "com.screeneditor.player.FORCE_RELOAD"
        const val ACTION_INSTALL_APK    = "com.screeneditor.player.INSTALL_APK"
        const val ACTION_SLEEP          = "com.screeneditor.player.SLEEP"
        const val ACTION_WAKE           = "com.screeneditor.player.WAKE"
        const val ACTION_REBOOT         = "com.screeneditor.player.REBOOT"
        const val ACTION_CLEAR_CACHE    = "com.screeneditor.player.CLEAR_CACHE"
    }

    private lateinit var webView: WebView
    private lateinit var overlayLayout: LinearLayout
    private lateinit var overlayStatus: TextView
    private lateinit var overlayDetail: TextView
    private lateinit var overlayProgress: ProgressBar
    private var receiverRegistered = false
    private var isLoadingPage = false
    private var isInStandby = false
    private var manualOverrideUntil = 0L  // timestamp until which schedule is ignored (manual sleep/wake)

    // Ticks every 60s to check schedule transitions — reliable because it runs
    // on the main thread regardless of WorkManager's 15-min minimum interval.
    private val scheduleHandler = Handler(Looper.getMainLooper())
    private var lastHeartbeatAt = 0L
    private var lastKnownHash = ""
    private val HEARTBEAT_INTERVAL_MS = 5 * 60_000L   // full heartbeat every 5 min
    private val HASH_POLL_INTERVAL_MS  = 60_000L       // lightweight hash check every 60s

    private val scheduleRunnable = object : Runnable {
        override fun run() {
            checkScheduleTransition()
            val now = System.currentTimeMillis()
            Thread {
                val prefs     = getSharedPreferences("device", Context.MODE_PRIVATE)
                val serverUrl = prefs.getString("serverUrl", "") ?: ""
                val slug      = prefs.getString("configSlug", "") ?: ""
                val token     = prefs.getString("displayToken", "") ?: ""

                // ── Lightweight hash poll (every 60s) ──────────────────────
                if (slug.isNotEmpty() && serverUrl.isNotEmpty()) {
                    val hashUrl = "$serverUrl/api/v1/screens/$slug/config-hash" +
                        if (token.isNotEmpty()) "?t=$token" else ""
                    val newHash = DeviceManager.fetchConfigHash(hashUrl)
                    if (newHash != null && newHash != lastKnownHash) {
                        Log.d("ScreenEditor", "Config hash changed ($lastKnownHash → $newHash) — sending heartbeat")
                        lastKnownHash = newHash
                        // Hash changed → force immediate full heartbeat
                        val result = DeviceManager.sendHeartbeat(this@MainActivity)
                        lastHeartbeatAt = System.currentTimeMillis()
                        if (result.configChanged) sendBroadcast(
                            Intent(ACTION_CONFIG_UPDATED).setPackage(packageName)
                        )
                        return@Thread
                    }
                }

                // ── Full heartbeat every 5 min regardless ──────────────────
                if (now - lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
                    val result = DeviceManager.sendHeartbeat(this@MainActivity)
                    lastHeartbeatAt = System.currentTimeMillis()
                    if (result.configChanged) sendBroadcast(
                        Intent(ACTION_CONFIG_UPDATED).setPackage(packageName)
                    )
                }
            }.start()
            scheduleHandler.postDelayed(this, HASH_POLL_INTERVAL_MS)
        }
    }

    private val configReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_CONFIG_UPDATED -> applyCurrentConfig()
                ACTION_FORCE_RELOAD -> {
                    DeviceManager.addLog(context, "i", "Remote force-reload received")
                    loadDisplayPage()
                }
                ACTION_INSTALL_APK -> {
                    val path = intent.getStringExtra("apkPath") ?: return
                    installApk(path)
                }
                ACTION_SLEEP  -> {
                    DeviceManager.addLog(context, "i", "Remote SLEEP command received")
                    manualOverrideUntil = System.currentTimeMillis() + 30 * 60_000L  // override schedule for 30 min
                    isInStandby = false  // reset guard so enterStandbyMode always runs
                    enterStandbyMode()
                }
                ACTION_WAKE   -> {
                    DeviceManager.addLog(context, "i", "Remote WAKE command received")
                    manualOverrideUntil = System.currentTimeMillis() + 30 * 60_000L
                    isInStandby = true  // reset guard so enterActiveMode always runs
                    enterActiveMode()
                }
                ACTION_REBOOT -> rebootDevice()
                ACTION_CLEAR_CACHE -> clearWebViewCache()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs     = getSharedPreferences("device", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("serverUrl", null)
        val deviceId  = prefs.getString("deviceId", null)

        // Not configured yet → open setup and destroy this instance
        if (serverUrl.isNullOrEmpty() || deviceId.isNullOrEmpty()) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }

        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val filter = IntentFilter().apply {
            addAction(ACTION_CONFIG_UPDATED)
            addAction(ACTION_FORCE_RELOAD)
            addAction(ACTION_INSTALL_APK)
            addAction(ACTION_SLEEP)
            addAction(ACTION_WAKE)
            addAction(ACTION_REBOOT)
            addAction(ACTION_CLEAR_CACHE)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.registerReceiver(this, configReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
            receiverRegistered = true
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            registerReceiver(configReceiver, filter)
            receiverRegistered = true
        }

        // ── Build UI: WebView + loading/error overlay ──────────────────────
        val rootFrame = FrameLayout(this)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                loadWithOverviewMode = true
                useWideViewPort = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = true
                allowContentAccess = true
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) safeBrowsingEnabled = false
                // Enable remote debugging in debug builds
                if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)
            }
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = false

                override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    isLoadingPage = true
                    showOverlay("Chargement...", url ?: "", loading = true)
                    Log.d(TAG, "Page started: $url")
                }

                override fun onPageFinished(view: WebView, url: String) {
                    super.onPageFinished(view, url)
                    isLoadingPage = false
                    hideOverlay()
                    DeviceManager.addLog(this@MainActivity, "i", "Loaded: $url")
                    Log.d(TAG, "Page finished: $url")
                }

                // Modern error handler (API 23+)
                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) {
                        val code = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) error.errorCode else -1
                        val desc = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) error.description.toString() else "Unknown"
                        val msg = "Erreur réseau $code: $desc"
                        DeviceManager.addLog(this@MainActivity, "e", msg)
                        Log.e(TAG, "onReceivedError main frame: $code $desc url=${request.url}")
                        isLoadingPage = false
                        showOverlay("❌ $msg", "Nouvelle tentative dans 15s...", loading = false)
                        view.postDelayed({ loadDisplayPage() }, 15_000L)
                    }
                }

                // Deprecated error handler (pre-API 23 fallback)
                @Deprecated("Deprecated in Java")
                @Suppress("DEPRECATION")
                override fun onReceivedError(view: WebView, errorCode: Int, description: String, failingUrl: String) {
                    val msg = "Erreur $errorCode: $description"
                    DeviceManager.addLog(this@MainActivity, "e", msg)
                    Log.e(TAG, "onReceivedError (legacy): $errorCode $description url=$failingUrl")
                    isLoadingPage = false
                    showOverlay("❌ $msg", "Nouvelle tentative dans 15s...", loading = false)
                    view.postDelayed({ loadDisplayPage() }, 15_000L)
                }

                // HTTP errors (4xx, 5xx)
                override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse) {
                    if (request.isForMainFrame) {
                        val code = errorResponse.statusCode
                        val msg = "HTTP $code: ${errorResponse.reasonPhrase}"
                        DeviceManager.addLog(this@MainActivity, "e", "HTTP error on main frame: $msg")
                        Log.e(TAG, "onReceivedHttpError main frame: $msg url=${request.url}")
                        isLoadingPage = false
                        showOverlay("❌ Erreur serveur ($code)", "Nouvelle tentative dans 15s...", loading = false)
                        view.postDelayed({ loadDisplayPage() }, 15_000L)
                    }
                }

                // SSL errors — log and proceed (needed for self-signed certs / dev servers)
                @SuppressLint("WebViewClientOnReceivedSslError")
                override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
                    val msg = "SSL error: ${error.primaryError} on ${error.url}"
                    DeviceManager.addLog(this@MainActivity, "w", msg)
                    Log.w(TAG, "onReceivedSslError: $msg — proceeding anyway")
                    // Proceed despite SSL error (signage player on trusted network)
                    handler.proceed()
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                    val level = when (consoleMessage.messageLevel()) {
                        ConsoleMessage.MessageLevel.ERROR -> "e"
                        ConsoleMessage.MessageLevel.WARNING -> "w"
                        else -> "d"
                    }
                    val logMsg = "JS[${consoleMessage.messageLevel()}]: ${consoleMessage.message()} (${consoleMessage.sourceId()}:${consoleMessage.lineNumber()})"
                    if (level == "e") {
                        DeviceManager.addLog(this@MainActivity, level, logMsg)
                    }
                    Log.d(TAG, logMsg)
                    return true
                }
            }
        }
        rootFrame.addView(webView, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

        // ── Loading / Error overlay ────────────────────────────────────────
        overlayLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#0a0a0e"))
            visibility = View.GONE
        }

        overlayProgress = ProgressBar(this).apply {
            isIndeterminate = true
            layoutParams = LinearLayout.LayoutParams(dp(48), dp(48)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                bottomMargin = dp(24)
            }
        }
        overlayLayout.addView(overlayProgress)

        overlayStatus = TextView(this).apply {
            textSize = 18f
            setTextColor(Color.parseColor("#e2e8f0"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dp(8)
                marginStart = dp(32)
                marginEnd = dp(32)
            }
        }
        overlayLayout.addView(overlayStatus)

        overlayDetail = TextView(this).apply {
            textSize = 13f
            setTextColor(Color.parseColor("#64748b"))
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginStart = dp(32)
                marginEnd = dp(32)
            }
        }
        overlayLayout.addView(overlayDetail)

        rootFrame.addView(overlayLayout, FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

        setContentView(rootFrame)
        setFullscreen()

        // ── Workers ────────────────────────────────────────────────────────
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "heartbeat", ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES).build()
        )
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "ota_check", ExistingPeriodicWorkPolicy.KEEP,
            PeriodicWorkRequestBuilder<OtaWorker>(30, TimeUnit.MINUTES).build()
        )

        // ── Schedule checker (every 60s, reliable) ─────────────────────────
        scheduleHandler.postDelayed(scheduleRunnable, 60_000L)

        loadDisplayPage()
    }

    /**
     * Called every 60s. Detects active↔standby transitions and acts immediately:
     * - active → standby : remove KEEP_SCREEN_ON + call sleepScreen()
     * - standby → active : restore KEEP_SCREEN_ON + reload content
     */
    private fun checkScheduleTransition() {
        if (!::webView.isInitialized) return
        // Skip schedule check if a manual override is active
        if (System.currentTimeMillis() < manualOverrideUntil) return
        val scheduleEnabled = ScheduleManager.isScheduleEnabled(this)
        if (!scheduleEnabled) {
            if (isInStandby) enterActiveMode()
            return
        }
        val withinSchedule = ScheduleManager.isWithinSchedule(this)
        when {
            !withinSchedule && !isInStandby -> enterStandbyMode()
            withinSchedule  &&  isInStandby -> enterActiveMode()
        }
    }

    private fun enterStandbyMode() {
        if (isInStandby) return
        isInStandby = true
        DeviceManager.addLog(this, "i", "Entering standby mode")
        window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        val msg = getSharedPreferences("device", Context.MODE_PRIVATE)
            .getString("standbyMessage", "Écran en veille") ?: "Écran en veille"
        showStandbyOverlay(msg)
        
        // Try hardware sleep but don't rely solely on it
        sleepScreen()
    }

    private fun enterActiveMode() {
        if (!isInStandby) return
        isInStandby = false
        DeviceManager.addLog(this, "i", "Entering active mode")
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        // Wake up hardware
        wakeScreen()
        
        hideStandbyOverlay()
        loadDisplayPage()
    }

    private fun wakeScreen() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            val wakeLock = pm.newWakeLock(
                android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK or android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "ScreenEditor:WakeUp"
            )
            wakeLock.acquire(3000)
            
            // Send MENU key to wake up some Android TVs
            val down = android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MENU)
            val up   = android.view.KeyEvent(android.view.KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_MENU)
            dispatchKeyEvent(down)
            dispatchKeyEvent(up)
        } catch (e: Exception) {
            DeviceManager.addLog(this, "e", "Wake error: ${e.message}")
        }
    }

    private fun showStandbyOverlay(message: String) {
        runOnUiThread {
            overlayStatus.text = message
            overlayDetail.text = "Planification active"
            overlayProgress.visibility = android.view.View.GONE
            overlayLayout.visibility = android.view.View.VISIBLE
            webView.visibility = android.view.View.INVISIBLE
        }
    }

    private fun hideStandbyOverlay() {
        runOnUiThread {
            overlayLayout.visibility = android.view.View.GONE
            webView.visibility = android.view.View.VISIBLE
        }
    }

    // ── Overlay helpers ────────────────────────────────────────────────────
    private fun showOverlay(status: String, detail: String, loading: Boolean) {
        runOnUiThread {
            overlayStatus.text = status
            overlayDetail.text = detail
            overlayProgress.visibility = if (loading) View.VISIBLE else View.GONE
            overlayLayout.visibility = View.VISIBLE
        }
    }

    private fun hideOverlay() {
        runOnUiThread {
            overlayLayout.visibility = View.GONE
        }
    }

    fun loadDisplayPage() {
        if (!::webView.isInitialized) return
        val prefs      = getSharedPreferences("device", Context.MODE_PRIVATE)
        val displayUrl = prefs.getString("displayUrl", null)
        val serverUrl  = prefs.getString("serverUrl", "") ?: ""
        val slug       = prefs.getString("configSlug", "") ?: ""
        val token      = prefs.getString("displayToken", "") ?: ""

        if (ScheduleManager.isScheduleEnabled(this) && !ScheduleManager.isWithinSchedule(this)) {
            if (!isInStandby) enterStandbyMode()
            return
        }

        val url = when {
            !displayUrl.isNullOrEmpty() -> displayUrl
            slug.isNotEmpty() && token.isNotEmpty() -> "$serverUrl/display/$slug?t=$token"
            slug.isNotEmpty() -> "$serverUrl/display/$slug"
            else -> {
                DeviceManager.addLog(this, "w", "No display URL configured")
                showOverlay("⚠ Aucune URL configurée", "Vérifiez la configuration dans le CMS", loading = false)
                return
            }
        }
        
        // Apply rotation from config
        applyRotation()
        
        DeviceManager.addLog(this, "i", "Loading: $url")
        Log.i(TAG, "loadDisplayPage: $url")
        webView.loadUrl(url)
    }

    private fun applyCurrentConfig() {
        if (!::webView.isInitialized) return
        val prefs      = getSharedPreferences("device", Context.MODE_PRIVATE)
        val displayUrl = prefs.getString("displayUrl", null)
        val serverUrl  = prefs.getString("serverUrl", "") ?: ""
        val slug       = prefs.getString("configSlug", "") ?: ""
        val token      = prefs.getString("displayToken", "") ?: ""
        val currentUrl = webView.url ?: ""

        if (ScheduleManager.isScheduleEnabled(this) && !ScheduleManager.isWithinSchedule(this)) {
            if (!isInStandby) enterStandbyMode()
            return
        }

        val expected = when {
            !displayUrl.isNullOrEmpty() -> displayUrl
            slug.isNotEmpty() && token.isNotEmpty() -> "$serverUrl/display/$slug?t=$token"
            slug.isNotEmpty() -> "$serverUrl/display/$slug"
            else -> return
        }
        // Always re-apply rotation in case it changed
        applyRotation()
        if (!currentUrl.startsWith(expected.substringBefore("?"))) {
            DeviceManager.addLog(this, "i", "Config changed -> reload $expected")
            loadDisplayPage()
        }
    }

    private fun showStandby(message: String) {
        webView.loadData("""
            <!DOCTYPE html><html><head><meta charset="utf-8">
            <style>body{margin:0;background:#0a0a0e;display:flex;align-items:center;justify-content:center;
            height:100vh;font-family:sans-serif;}.msg{color:#4a4a6a;font-size:2rem;text-align:center;}</style>
            </head><body><div class="msg">$message</div></body></html>
        """.trimIndent(), "text/html", "utf-8")
    }

    fun installApk(apkPath: String) {
        try {
            val file = File(apkPath)
            if (!file.exists()) { DeviceManager.addLog(this, "e", "APK not found: $apkPath"); return }
            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
            } else {
                @Suppress("DEPRECATION") Uri.fromFile(file)
            }
            startActivity(Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
            })
            DeviceManager.addLog(this, "i", "APK installer launched: $apkPath")
        } catch (e: Exception) {
            DeviceManager.addLog(this, "e", "installApk error: ${e.message}")
        }
    }

    private fun clearWebViewCache() {
        if (!::webView.isInitialized) return
        DeviceManager.addLog(this, "i", "Clearing WebView cache")
        webView.clearCache(true)
        webView.clearHistory()
        loadDisplayPage()
    }

    private fun sleepScreen() {
        try {
            DeviceManager.addLog(this, "i", "Sleep requested")
            val down = android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_SLEEP)
            val up   = android.view.KeyEvent(android.view.KeyEvent.ACTION_UP,   KeyEvent.KEYCODE_SLEEP)
            dispatchKeyEvent(down)
            dispatchKeyEvent(up)
        } catch (e: Exception) {
            DeviceManager.addLog(this, "e", "Sleep error: ${e.message}")
        }
    }

    private fun rebootDevice() {
        try {
            DeviceManager.addLog(this, "i", "Reboot requested")
            Runtime.getRuntime().exec(arrayOf("su", "-c", "reboot"))
        } catch (e: Exception) {
            try { Runtime.getRuntime().exec("reboot") } catch (_: Exception) {}
            DeviceManager.addLog(this, "e", "Reboot needs root: ${e.message}")
        }
    }

    private fun setFullscreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.apply {
                hide(WindowInsets.Type.systemBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK || keyCode == KeyEvent.KEYCODE_HOME) return true
        return super.onKeyDown(keyCode, event)
    }

    override fun onResume() {
        super.onResume()
        setFullscreen()
        if (::webView.isInitialized) applyCurrentConfig()
    }

    override fun onDestroy() {
        super.onDestroy()
        scheduleHandler.removeCallbacks(scheduleRunnable)
        if (receiverRegistered) { unregisterReceiver(configReceiver); receiverRegistered = false }
        if (::webView.isInitialized) webView.destroy()
    }

    private fun applyRotation() {
        try {
            val prefs = getSharedPreferences("device", Context.MODE_PRIVATE)
            val rotation = prefs.getString("screenRotation", "0") ?: "0"
            val orientation = when (rotation) {
                "90"  -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
                "180" -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
                "270" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
                else  -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            }
            requestedOrientation = orientation
            DeviceManager.addLog(this, "i", "OS rotation applied: ${rotation}°")
        } catch (e: Exception) {
            DeviceManager.addLog(this, "e", "Rotation error: ${e.message}")
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}

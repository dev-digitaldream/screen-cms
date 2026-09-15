package com.screeneditor.player

import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object DeviceManager {

    private const val PREFS_NAME = "device"
    private const val PREFS_LOGS = "device_logs"
    private const val MAX_LOGS = 200
    private const val TIMEOUT_MS = 10_000

    data class RegisterResult(val success: Boolean, val deviceId: String? = null, val error: String? = null)

    data class HeartbeatResult(
        val success: Boolean,
        val configChanged: Boolean = false,
        val forceReload: Boolean = false,
        val clearCache: Boolean = false,
        val error: String? = null
    )

    fun init(context: Context, serverUrl: String, deviceId: String, deviceName: String) {
        // kept for compatibility — values are read from prefs directly
    }

    fun register(
        serverUrl: String, deviceId: String, deviceName: String,
        model: String, androidVersion: String, sdkInt: Int
    ): RegisterResult {
        return try {
            val conn = openPost("$serverUrl/api/v1/devices")
            val body = JSONObject().apply {
                put("id", deviceId); put("name", deviceName); put("model", model)
                put("androidVersion", androidVersion); put("sdkInt", sdkInt)
                put("appVersion", BuildConfig.VERSION_NAME)
            }.toString()
            OutputStreamWriter(conn.outputStream).use { it.write(body) }
            val code = conn.responseCode
            val resp = readResponse(conn)
            conn.disconnect()
            if (code in 200..299) {
                RegisterResult(true, deviceId = JSONObject(resp).optString("deviceId", deviceId))
            } else {
                RegisterResult(false, error = "HTTP $code")
            }
        } catch (e: Exception) {
            RegisterResult(false, error = e.message)
        }
    }

    fun sendHeartbeat(context: Context): HeartbeatResult {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("serverUrl", "") ?: ""
        val deviceId  = prefs.getString("deviceId", "") ?: ""
        if (serverUrl.isEmpty() || deviceId.isEmpty()) return HeartbeatResult(false, error = "Not configured")

        return try {
            val loadedSlug = prefs.getString("configSlug", "") ?: ""
            val memInfo = android.app.ActivityManager.MemoryInfo()
            (context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager).getMemoryInfo(memInfo)
            val memUsedMb  = ((memInfo.totalMem - memInfo.availMem) / 1048576).toInt()
            val memTotalMb = (memInfo.totalMem / 1048576).toInt()

            val pendingLogs = getLogs(context)
            clearLogs(context)
            val logsArray = JSONArray().also { arr ->
                pendingLogs.forEach { log ->
                    arr.put(JSONObject().apply { put("ts", log.ts); put("level", log.level); put("msg", log.msg) })
                }
            }

            val body = JSONObject().apply {
                put("deviceName", prefs.getString("deviceName", "Android TV") ?: "Android TV")
                put("model", Build.MODEL)
                put("androidVersion", Build.VERSION.RELEASE)
                put("sdkInt", Build.VERSION.SDK_INT)
                put("appVersion", BuildConfig.VERSION_NAME)
                put("loadedSlug", loadedSlug)
                put("memUsedMb", memUsedMb)
                put("memTotalMb", memTotalMb)
                put("logs", logsArray)
            }.toString()

            val conn = openPost("$serverUrl/api/v1/devices/$deviceId/heartbeat")
            OutputStreamWriter(conn.outputStream).use { it.write(body) }
            val code = conn.responseCode
            val resp = readResponse(conn)
            conn.disconnect()

            if (code in 200..299) {
                val result = applyRemoteConfig(context, resp)
                HeartbeatResult(true, configChanged = result.configChanged, forceReload = result.forceReload, clearCache = result.clearCache)
            } else {
                HeartbeatResult(false, error = "HTTP $code")
            }
        } catch (e: Exception) {
            addLog(context, "e", "Heartbeat failed: ${e.message}")
            HeartbeatResult(false, error = e.message)
        }
    }

    private data class ApplyResult(val configChanged: Boolean, val forceReload: Boolean, val clearCache: Boolean = false)

    private fun applyRemoteConfig(context: Context, responseBody: String): ApplyResult {
        return try {
            val json   = JSONObject(responseBody)
            val config = json.optJSONObject("config") ?: return ApplyResult(false, false)
            val prefs  = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            var configChanged = false
            val forceReload   = config.optBoolean("forceReload", false)
            val clearCache    = config.optBoolean("clearCache", false)
            val sleep         = config.optBoolean("sleep", false)
            val wake          = config.optBoolean("wake", false)
            val reboot        = config.optBoolean("reboot", false)

            val pkg = context.packageName
            if (sleep || wake || reboot || forceReload || clearCache) {
                addLog(context, "i", "Remote flags: sleep=$sleep wake=$wake reboot=$reboot reload=$forceReload cache=$clearCache")
            }
            if (sleep) context.sendBroadcast(Intent(MainActivity.ACTION_SLEEP).setPackage(pkg))
            if (wake) context.sendBroadcast(Intent(MainActivity.ACTION_WAKE).setPackage(pkg))
            if (reboot) context.sendBroadcast(Intent(MainActivity.ACTION_REBOOT).setPackage(pkg))
            if (forceReload) context.sendBroadcast(Intent(MainActivity.ACTION_FORCE_RELOAD).setPackage(pkg))
            if (clearCache) context.sendBroadcast(Intent(MainActivity.ACTION_CLEAR_CACHE).setPackage(pkg))

            val slug  = config.optString("slug", "")
            val token = config.optString("displayToken", "")
            val rotation = config.optString("rotation", "0")
            
            prefs.edit().apply {
                if (slug.isNotEmpty() && (slug != prefs.getString("configSlug", "") || token != prefs.getString("displayToken", ""))) {
                    putString("configSlug", slug)
                    if (token.isNotEmpty()) {
                        putString("displayToken", token)
                        val base = prefs.getString("serverUrl", "") ?: ""
                        if (base.isNotEmpty()) putString("displayUrl", "$base/display/$slug?t=$token")
                    }
                    configChanged = true
                }
                
                // Always apply rotation if changed
                if (rotation != prefs.getString("screenRotation", "0")) {
                    putString("screenRotation", rotation)
                    configChanged = true
                }
                putBoolean("scheduleEnabled", config.optBoolean("scheduleEnabled", false))
                val days = config.optString("scheduleDays", ""); if (days.isNotEmpty()) putString("scheduleDays", days)
                val start = config.optString("scheduleStart", ""); if (start.isNotEmpty()) putString("scheduleStart", start)
                val end = config.optString("scheduleEnd", ""); if (end.isNotEmpty()) putString("scheduleEnd", end)
                val msg = config.optString("standbyMessage", ""); if (msg.isNotEmpty()) putString("standbyMessage", msg)
                apply()
            }

            ApplyResult(configChanged, forceReload, clearCache)
        } catch (e: Exception) {
            addLog(context, "e", "applyRemoteConfig error: ${e.message}")
            ApplyResult(false, false)
        }
    }

    // ── Logging ────────────────────────────────────────────────────────────────

    data class LogEntry(val ts: String, val level: String, val msg: String)

    fun addLog(context: Context, level: String, msg: String) {
        try {
            val prefs    = context.getSharedPreferences(PREFS_LOGS, Context.MODE_PRIVATE)
            val existing = prefs.getString("logs", "[]") ?: "[]"
            val arr      = JSONArray(existing)
            val sdf      = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            arr.put(JSONObject().apply { put("ts", sdf.format(Date())); put("level", level); put("msg", msg) })
            val trimmed = JSONArray()
            val start = maxOf(0, arr.length() - MAX_LOGS)
            for (i in start until arr.length()) trimmed.put(arr.get(i))
            prefs.edit().putString("logs", trimmed.toString()).apply()
        } catch (_: Exception) {}
    }

    fun getLogs(context: Context): List<LogEntry> {
        return try {
            val arr = JSONArray(context.getSharedPreferences(PREFS_LOGS, Context.MODE_PRIVATE).getString("logs", "[]") ?: "[]")
            (0 until arr.length()).map { i ->
                arr.getJSONObject(i).let { LogEntry(it.optString("ts"), it.optString("level", "i"), it.optString("msg")) }
            }
        } catch (_: Exception) { emptyList() }
    }

    fun clearLogs(context: Context) {
        context.getSharedPreferences(PREFS_LOGS, Context.MODE_PRIVATE).edit().putString("logs", "[]").apply()
    }

    // ── Lightweight config hash poll ──────────────────────────────────────────

    fun fetchConfigHash(url: String): String? {
        return try {
            val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 5_000
                readTimeout = 5_000
            }
            val code = conn.responseCode
            val body = readResponse(conn)
            conn.disconnect()
            if (code == 200) JSONObject(body).optString("hash", null)
            else null
        } catch (_: Exception) { null }
    }

    // ── HTTP helpers ───────────────────────────────────────────────────────────

    private fun openPost(urlStr: String): HttpURLConnection {
        return (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            connectTimeout = TIMEOUT_MS
            readTimeout = TIMEOUT_MS
            doOutput = true
        }
    }

    private fun readResponse(conn: HttpURLConnection): String {
        return try {
            if (conn.responseCode in 200..299) conn.inputStream.bufferedReader().readText()
            else conn.errorStream?.bufferedReader()?.readText() ?: ""
        } catch (_: Exception) { "" }
    }
}

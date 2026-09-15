package com.screeneditor.player

import android.content.Context
import android.content.Intent
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.Calendar

/**
 * OTA update worker — runs periodically but ONLY installs between 2:00-5:00 AM
 * to avoid interrupting the display during the day.
 * Also tracks attempted versions so we don't download/install in a loop.
 */
class OtaWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    companion object {
        private const val OTA_WINDOW_START = 2  // 2:00 AM
        private const val OTA_WINDOW_END   = 5  // 5:00 AM
    }

    override fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("device", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("serverUrl", "") ?: ""
        if (serverUrl.isEmpty()) return Result.success()

        // Only proceed during the night maintenance window (2-5 AM)
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        if (hour < OTA_WINDOW_START || hour >= OTA_WINDOW_END) {
            return Result.success()  // silently skip, will retry next cycle
        }

        return try {
            // 1. Check if new APK is available
            val infoUrl = URL("$serverUrl/api/v1/apk-info")
            val conn = (infoUrl.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
            }
            if (conn.responseCode != 200) return Result.success()
            val body = conn.inputStream.bufferedReader().readText()
            conn.disconnect()

            val info = JSONObject(body)
            if (!info.optBoolean("available", false)) return Result.success()

            val remoteVersion = info.optInt("versionCode", 0)
            val currentVersion = try {
                applicationContext.packageManager
                    .getPackageInfo(applicationContext.packageName, 0)
                    .let {
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P)
                            it.longVersionCode.toInt()
                        else
                            @Suppress("DEPRECATION") it.versionCode
                    }
            } catch (_: Exception) { 1 }

            // Already up to date
            if (remoteVersion <= currentVersion) {
                // Clear attempted flag if we successfully updated
                prefs.edit().remove("ota_attempted_version").apply()
                return Result.success()
            }

            // Skip if we already attempted this version (avoid loop)
            val attemptedVersion = prefs.getInt("ota_attempted_version", 0)
            if (remoteVersion <= attemptedVersion) {
                return Result.success()  // silent — already tried
            }

            // 2. New version — download
            val apkUrl = "$serverUrl${info.optString("url")}"
            DeviceManager.addLog(applicationContext, "i",
                "OTA: night update v$remoteVersion — downloading")

            val apkFile = File(applicationContext.cacheDir, "update.apk")
            downloadFile(apkUrl, apkFile)

            DeviceManager.addLog(applicationContext, "i",
                "OTA: download complete (${apkFile.length() / 1024} KB)")

            // Mark this version as attempted BEFORE install to prevent loop
            prefs.edit().putInt("ota_attempted_version", remoteVersion).apply()

            // 3. Trigger install via broadcast to MainActivity
            applicationContext.sendBroadcast(
                Intent(MainActivity.ACTION_INSTALL_APK)
                    .setPackage(applicationContext.packageName)
                    .putExtra("apkPath", apkFile.absolutePath)
            )

            Result.success()
        } catch (e: Exception) {
            DeviceManager.addLog(applicationContext, "e", "OTA check failed: ${e.message}")
            Result.success()  // don't retry aggressively, wait for next scheduled run
        }
    }

    private fun downloadFile(urlStr: String, dest: File) {
        val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15_000
            readTimeout = 60_000
        }
        conn.inputStream.use { input ->
            FileOutputStream(dest).use { output ->
                input.copyTo(output)
            }
        }
        conn.disconnect()
    }
}

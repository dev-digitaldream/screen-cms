package com.screeneditor.player

import android.content.Context
import android.content.Intent
import android.os.PowerManager
import androidx.work.Worker
import androidx.work.WorkerParameters

class HeartbeatWorker(
    context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    override fun doWork(): Result {
        return try {
            val result = DeviceManager.sendHeartbeat(applicationContext)

            // Cache clear (one-shot flag from CMS)
            if (result.clearCache) {
                applicationContext.sendBroadcast(
                    Intent(MainActivity.ACTION_CLEAR_CACHE)
                        .setPackage(applicationContext.packageName)
                )
            }

            // Config changed: re-evaluate screen URL
            if (result.configChanged) {
                applicationContext.sendBroadcast(
                    Intent(MainActivity.ACTION_CONFIG_UPDATED)
                        .setPackage(applicationContext.packageName)
                )
            }

            // Force reload from CMS
            if (result.forceReload) {
                applicationContext.sendBroadcast(
                    Intent(MainActivity.ACTION_FORCE_RELOAD)
                        .setPackage(applicationContext.packageName)
                )
            }

            // If screen is in standby and schedule says it should now be active,
            // wake the screen with a WakeLock so MainActivity.onResume() fires.
            if (ScheduleManager.isScheduleEnabled(applicationContext)
                && ScheduleManager.isWithinSchedule(applicationContext)
            ) {
                wakeScreenIfNeeded()
            }

            if (result.success) Result.success() else Result.retry()
        } catch (e: Exception) {
            DeviceManager.addLog(applicationContext, "e", "HeartbeatWorker: ${e.message}")
            Result.retry()
        }
    }

    /**
     * Acquires FULL_WAKE_LOCK + ACQUIRE_CAUSES_WAKEUP to turn on the screen
     * from background without DEVICE_POWER permission (WAKE_LOCK is enough).
     */
    @Suppress("DEPRECATION")
    private fun wakeScreenIfNeeded() {
        try {
            val pm = applicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isInteractive) {
                val wl = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "ScreenEditor:scheduleWake"
                )
                wl.acquire(5_000L)
                wl.release()
                DeviceManager.addLog(applicationContext, "i", "Schedule: screen woken up by heartbeat")
            }
        } catch (e: Exception) {
            DeviceManager.addLog(applicationContext, "w", "wakeScreen error: ${e.message}")
        }
    }
}

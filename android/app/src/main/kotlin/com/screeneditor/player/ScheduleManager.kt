package com.screeneditor.player

import android.content.Context
import java.util.Calendar

/**
 * Checks if the current time/day is within the configured schedule.
 * Days follow ISO 8601: 1=Monday, 2=Tuesday, ..., 7=Sunday.
 */
object ScheduleManager {

    fun isScheduleEnabled(context: Context): Boolean {
        val prefs = context.getSharedPreferences("device", Context.MODE_PRIVATE)
        return prefs.getBoolean("scheduleEnabled", false)
    }

    /**
     * Returns true if the current time is within the allowed schedule window.
     * If schedule is disabled, always returns true.
     */
    fun isWithinSchedule(context: Context): Boolean {
        val prefs = context.getSharedPreferences("device", Context.MODE_PRIVATE)

        if (!prefs.getBoolean("scheduleEnabled", false)) return true

        val daysStr = prefs.getString("scheduleDays", "1,2,3,4,5") ?: "1,2,3,4,5"
        val startStr = prefs.getString("scheduleStart", "08:00") ?: "08:00"
        val endStr = prefs.getString("scheduleEnd", "18:00") ?: "18:00"

        val allowedDays = daysStr.split(",").mapNotNull { it.trim().toIntOrNull() }.toSet()

        val calendar = Calendar.getInstance()
        // Calendar.DAY_OF_WEEK: 1=Sunday, 2=Monday, ..., 7=Saturday
        // ISO: 1=Monday, ..., 7=Sunday
        val calDay = calendar.get(Calendar.DAY_OF_WEEK)
        val isoDay = when (calDay) {
            Calendar.MONDAY -> 1
            Calendar.TUESDAY -> 2
            Calendar.WEDNESDAY -> 3
            Calendar.THURSDAY -> 4
            Calendar.FRIDAY -> 5
            Calendar.SATURDAY -> 6
            Calendar.SUNDAY -> 7
            else -> 1
        }

        if (isoDay !in allowedDays) return false

        val currentHour = calendar.get(Calendar.HOUR_OF_DAY)
        val currentMin = calendar.get(Calendar.MINUTE)
        val currentMinutes = currentHour * 60 + currentMin

        val startMinutes = parseTimeToMinutes(startStr)
        val endMinutes = parseTimeToMinutes(endStr)

        return currentMinutes in startMinutes until endMinutes
    }

    private fun parseTimeToMinutes(timeStr: String): Int {
        return try {
            val parts = timeStr.split(":")
            val hours = parts[0].trim().toInt()
            val minutes = if (parts.size > 1) parts[1].trim().toInt() else 0
            hours * 60 + minutes
        } catch (_: Exception) {
            0
        }
    }
}

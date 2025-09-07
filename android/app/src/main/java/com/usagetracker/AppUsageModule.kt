package com.usagetracker

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import org.json.JSONArray
import org.json.JSONObject

// Use @ReactModule annotation to help with auto-linking in newer React Native versions.
@ReactModule(name = AppUsageModule.NAME)
class AppUsageModule(reactContext: ReactApplicationContext) :
        ReactContextBaseJavaModule(reactContext) {

    // Define the module name as a constant for easy access.
    companion object {
        const val NAME = "AppUsage"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            // It's good practice to set this flag for activities started from a module.
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ACTIVITY_NOT_FOUND_ERROR", "Could not open Usage Access Settings.", e)
        }
    }

    @ReactMethod
    fun getUsageStats(start: Double, end: Double, promise: Promise) {
        try {
            // Get the Context correctly from the application context.
            val context = reactApplicationContext.applicationContext
            val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val stats: List<UsageStats>? =
                    usm.queryUsageStats(
                            UsageStatsManager.INTERVAL_BEST,
                            start.toLong(),
                            end.toLong()
                    )

            val jsonArray = JSONArray()

            // Check if stats is not null to prevent crashes.
            if (stats != null) {
                for (u in stats) {
                    // Check for valid package name and foreground time.
                    if (u.packageName != null && u.totalTimeInForeground > 0) {
                        val obj = JSONObject()
                        obj.put("packageName", u.packageName)
                        obj.put("totalTimeInForeground", u.totalTimeInForeground)
                        jsonArray.put(obj)
                    }
                }
            }

            // Resolve the promise with the JSON string.
            promise.resolve(jsonArray.toString())
        } catch (e: Exception) {
            // Reject the promise if any error occurs.
            promise.reject("USAGE_STATS_ERROR", "An error occurred while getting usage stats.", e)
        }
    }
}

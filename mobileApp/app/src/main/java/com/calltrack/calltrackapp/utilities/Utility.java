package com.calltrack.calltrackapp.utilities;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.Settings;

import com.google.firebase.crashlytics.FirebaseCrashlytics;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Utility {

    public static String getOrCreateUUID(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE);
        String uuid = prefs.getString("uuid", null);
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
            prefs.edit().putString("uuid", uuid).apply();
        }
        return uuid;
    }

    public static int getBatteryPercentage(Context context) {
        BatteryManager bm = (BatteryManager) context.getSystemService(Context.BATTERY_SERVICE);
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
    }
    public static String getDeviceInfo(android.content.Context context) {
        JSONObject json = new JSONObject();
        try {
            // Basic Build info
            json.put("manufacturer", Build.MANUFACTURER);
            json.put("brand", Build.BRAND);
            json.put("model", Build.MODEL);
            json.put("device", Build.DEVICE);
            json.put("product", Build.PRODUCT);
            json.put("hardware", Build.HARDWARE);
            json.put("board", Build.BOARD);
            json.put("id", Build.ID);
            json.put("user", Build.USER);
            json.put("host", Build.HOST);
            json.put("type", Build.TYPE);
            json.put("fingerprint", Build.FINGERPRINT);
            json.put("version_release", Build.VERSION.RELEASE);
            json.put("version_sdk_int", Build.VERSION.SDK_INT);
            json.put("version_codename", Build.VERSION.CODENAME);
            json.put("version_incremental", Build.VERSION.INCREMENTAL);
        } catch (Exception e) {
            FirebaseCrashlytics.getInstance().recordException(e);
        }
        return json.toString();
    }

}


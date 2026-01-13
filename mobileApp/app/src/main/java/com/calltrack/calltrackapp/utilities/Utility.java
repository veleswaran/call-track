package com.calltrack.calltrackapp.utilities;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.BatteryManager;

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

}

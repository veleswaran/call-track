package com.calltrack.calltrackapp.utilities;

import android.content.Context;
import android.content.SharedPreferences;

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

}

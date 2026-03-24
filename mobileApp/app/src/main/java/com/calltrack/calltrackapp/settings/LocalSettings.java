package com.calltrack.calltrackapp.settings;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.provider.CallLog;
import android.util.Log;

public class LocalSettings {

    private static final String PREFERENCE_KEY = "log_prefs";
    private static final String LAST_PROCESSED_KEY = "last_processed_id";

    final private Context context;

    public LocalSettings(Context context) {
        this.context = context;
    }

    public long getLastProcessedCallId() {
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCE_KEY, Context.MODE_PRIVATE);
        return prefs.getLong(LAST_PROCESSED_KEY, -1);
    }

    public void setLastProcessedCallId(Long value) {
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCE_KEY, Context.MODE_PRIVATE);
        prefs.edit().putLong(LAST_PROCESSED_KEY, value).apply();
    }

    public void setToCurrentCallId() {
        String[] projection = {CallLog.Calls._ID};
        try (Cursor cursor = context.getContentResolver().query(
            CallLog.Calls.CONTENT_URI, projection, null, null, CallLog.Calls._ID + " DESC")) {
            if (cursor != null && cursor.moveToFirst()) {
                long lastProcessedId = cursor.getLong(cursor.getColumnIndexOrThrow(CallLog.Calls._ID));
                setLastProcessedCallId(lastProcessedId);
            }
        }
    }

    public void resetToCurrentCallId() {
        long lastProcessedId = getLastProcessedCallId();
        if (lastProcessedId <= 0) {
            setToCurrentCallId();
        }
    }


}

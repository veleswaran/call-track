package com.calltrack.calltrackapp.monitors;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.provider.CallLog;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.util.Log;

import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.utilities.Utility;

import java.util.List;

import androidx.core.app.ActivityCompat;

public class SaveCore {

    final private Context context;
    private static final String PREFERENCE_KEY = "log_prefs";
    private static final String LAST_PROCESSED_KEY = "last_processed_id";

    public SaveCore(Context context) {
        this.context = context;
    }

    public void ProcessCalls() {
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCE_KEY, Context.MODE_PRIVATE);
        long lastProcessedId = prefs.getLong(LAST_PROCESSED_KEY, -1);
        String selection = lastProcessedId > 0 ? CallLog.Calls._ID + " > ?" : null;
        String[] selectionArgs = lastProcessedId > 0 ? new String[]{String.valueOf(lastProcessedId)} : null;
        String[] projection = {CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.DATE, CallLog.Calls.DURATION, "subscription_id", CallLog.Calls._ID};
        try (Cursor cursor = context.getContentResolver().query(CallLog.Calls.CONTENT_URI, projection, selection, selectionArgs, CallLog.Calls._ID + " ASC")) {
            if (cursor == null) return;
            int batteryLevel = Utility.getBatteryPercentage(context);
            Long LatestProcessedId = -1L;
            while (cursor.moveToNext()) {
                CallRecord record = new CallRecord();
                record.synced = false;
                record.batteryLevel = batteryLevel;
                record.callLocalId = getLongSafe(cursor, CallLog.Calls._ID);
                record.number = getStringSafe(cursor, CallLog.Calls.NUMBER);
                record.date = getLongSafe(cursor, CallLog.Calls.DATE);
                record.duration = getStringSafe(cursor, CallLog.Calls.DURATION);
                int type = getIntSafe(cursor, CallLog.Calls.TYPE);
                record.type = mapCallType(type);
                record.metaData = String.valueOf(type);
                int subId = getIntSafe(cursor, "subscription_id");
                fillSubscriptionInfo(context, record, subId);
                persistRecord(context.getApplicationContext(), record);
                LatestProcessedId = record.callLocalId;
            }
            prefs.edit().putLong(LAST_PROCESSED_KEY, LatestProcessedId).apply();
        } catch (Exception e) {
            Log.e("CallMonitor -> saveLatestCall", "Exception occurred", e);
        }
    }

    private String getStringSafe(Cursor cursor, String column) {
        int index = cursor.getColumnIndex(column);
        return index >= 0 ? cursor.getString(index) : null;
    }

    private long getLongSafe(Cursor cursor, String column) {
        int index = cursor.getColumnIndex(column);
        return index >= 0 ? cursor.getLong(index) : 0L;
    }

    private int getIntSafe(Cursor cursor, String column) {
        int index = cursor.getColumnIndex(column);
        return index >= 0 ? cursor.getInt(index) : -1;
    }

    private String mapCallType(int type) {
        switch (type) {
            case CallLog.Calls.INCOMING_TYPE:
                return "INCOMING";
            case CallLog.Calls.OUTGOING_TYPE:
                return "OUTGOING";
            case CallLog.Calls.MISSED_TYPE:
                return "MISSED";
            default:
                return "UNKNOWN";
        }
    }

    private void fillSubscriptionInfo(Context context, CallRecord record, int subId) {
        if (subId < 0) return;
        SubscriptionManager sm = (SubscriptionManager) context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            List<SubscriptionInfo> subs = sm.getActiveSubscriptionInfoList();
            if (subs == null) return;
            for (SubscriptionInfo info : subs) {
                if (info.getSubscriptionId() == subId) {
                    record.simSlot = info.getSimSlotIndex();
                    record.carrier = info.getCarrierName().toString();
                    break;
                }
            }
        }
    }

    private void persistRecord(Context context, CallRecord record) {
        AppDB db = AppDB.getInstance(context);
        TokenEntity te = db.tokenDao().getOne();
        if (te == null || te.simSlots.contains(record.simSlot)) {
            db.callRecordDao().insert(record);
//            Log.d("CallMonitor", "Call record persisted: " + record.type + " " + record.number);
        } else {
//            Log.d("CallMonitor", "Skipped persisting record due to SIM slot mismatch");
        }
    }

}

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
import com.calltrack.calltrackapp.settings.LocalSettings;
import com.calltrack.calltrackapp.utilities.Utility;

import java.util.List;

import androidx.core.app.ActivityCompat;

public class SaveCore {

    final private Context context;
    final private LocalSettings localSettings;

    public SaveCore(Context context) {
        this.context = context;
        localSettings = new LocalSettings(context);
    }

    public void ProcessCalls() {
        long lastProcessedId = localSettings.getLastProcessedCallId();
        if (lastProcessedId > 0) {
            String selection = CallLog.Calls._ID + " > ?";
            String[] selectionArgs = new String[]{String.valueOf(lastProcessedId)};
            String[] projection = {CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.DATE, CallLog.Calls.DURATION, "subscription_id", CallLog.Calls._ID};
            try (Cursor cursor = context.getContentResolver().query(CallLog.Calls.CONTENT_URI, projection, selection, selectionArgs, CallLog.Calls._ID + " ASC")) {
                if (cursor == null) return;
                int batteryLevel = Utility.getBatteryPercentage(context);
                Long latestProcessedId = -1L;
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
                    latestProcessedId = record.callLocalId;
                }
                localSettings.setLastProcessedCallId(latestProcessedId);
            } catch (Exception e) {
                Log.e("CallMonitor -> saveLatestCall", "Exception occurred", e);
            }
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
        if (te != null && te.simSlots.contains(record.simSlot)) {
            db.callRecordDao().insert(record);
//            Log.d("CallMonitor", "Call record persisted: " + record.type + " " + record.number);
        } else {
//            Log.d("CallMonitor", "Skipped persisting record due to SIM slot mismatch");
        }
    }

}

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
import com.google.firebase.crashlytics.FirebaseCrashlytics;

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
        localSettings.resetToCurrentCallId();
        long lastProcessedId = localSettings.getLastProcessedCallId();
        if (lastProcessedId > 0) {
            String selection = CallLog.Calls._ID + " > ?";
            String[] selectionArgs = new String[]{String.valueOf(lastProcessedId)};
            String[] projection = {CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.DATE, CallLog.Calls.DURATION, "subscription_id", CallLog.Calls._ID, CallLog.Calls.CACHED_NAME};
            try (Cursor cursor = context.getContentResolver().query(CallLog.Calls.CONTENT_URI, projection, selection, selectionArgs, CallLog.Calls._ID + " ASC")) {
                if (cursor == null) return;
                int batteryLevel = Utility.getBatteryPercentage(context);
                while (cursor.moveToNext()) {
                    Log.e("CallMonitor -> ProcessCalls", "Data fetched");
                    CallRecord record = new CallRecord();
                    record.synced = false;
                    record.batteryLevel = batteryLevel;
                    record.callLocalId = getLongSafe(cursor, CallLog.Calls._ID);
                    record.number = getStringSafe(cursor, CallLog.Calls.NUMBER);
                    record.phoneContactName = getStringSafe(cursor, CallLog.Calls.CACHED_NAME);
                    record.date = getLongSafe(cursor, CallLog.Calls.DATE);
                    record.duration = getStringSafe(cursor, CallLog.Calls.DURATION);
                    int type = getIntSafe(cursor, CallLog.Calls.TYPE);
                    record.type = mapCallType(type);
//                    int blockReason = getIntSafe(cursor, "block_reason");
                    int blockReason = -1;
                    record.metaData = buildMetadata(type, blockReason);
                    int subId = getIntSafe(cursor, "subscription_id");
                    fillSubscriptionInfo(context, record, subId);
                    persistRecord(context.getApplicationContext(), record);
                    lastProcessedId = record.callLocalId;
                    Log.e("CallMonitor -> saveLatestCall", "SIM " + record.simSlot);
                    FirebaseCrashlytics.getInstance().log("SIM -> " + record.simSlot);
                }
                localSettings.setLastProcessedCallId(lastProcessedId);
            } catch (Exception e) {
                Log.e("CallMonitor -> saveLatestCall", "Exception occurred", e);
                FirebaseCrashlytics.getInstance().recordException(e);
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
            case CallLog.Calls.REJECTED_TYPE:
                return "REJECTED";
            case CallLog.Calls.BLOCKED_TYPE:
                return "BLOCKED";
            default:
                return "UNKNOWN";
        }
    }

    private String buildMetadata(int type, int blockReason) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"call_type_code\":").append(type);
        if (type == CallLog.Calls.BLOCKED_TYPE && blockReason >= 0) {
            sb.append(",\"block_reason_code\":").append(blockReason);
            sb.append(",\"block_reason\":\"").append(mapBlockReason(blockReason)).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private String mapBlockReason(int reason) {
        switch (reason) {
            case 0:
                return "not_blocked";
            case 1:
                return "call_screening_service";
            case 2:
                return "direct_to_voicemail";
            case 3:
                return "blocked_number";
            case 4:
                return "unknown_number";
            case 5:
                return "restricted_number";
            case 6:
                return "pay_phone";
            case 7:
                return "not_in_contacts";
            default:
                return "unknown";
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
        if (te.simSlots.contains(record.simSlot) || record.simSlot == null) {
            db.callRecordDao().insert(record);
//            Log.d("CallMonitor", "Call record persisted: " + record.type + " " + record.number);
        } else {
            Log.d("CallMonitor", "Skipped persisting record due to SIM slot mismatch");
        }
    }

}

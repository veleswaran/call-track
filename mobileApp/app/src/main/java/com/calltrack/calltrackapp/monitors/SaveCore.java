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
            // Include vendor-specific columns: simid (OPPO/Realme), phone_account_address (OPPO phone number)
            String[] projection = {CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.DATE, CallLog.Calls.DURATION, "subscription_id", "simid", "phone_account_address", CallLog.Calls._ID, CallLog.Calls.CACHED_NAME};
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

                    // Try enhanced SIM detection (supports OPPO/Realme)
                    detectAndFillSimSlot(context, cursor, record);

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

    /**
     * Enhanced SIM slot detection with OPPO/Realme support
     * Tries multiple methods and logs failures to Crashlytics
     */
    private void detectAndFillSimSlot(Context context, Cursor cursor, CallRecord record) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        SubscriptionManager sm = (SubscriptionManager) context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
        if (sm == null) return;

        List<SubscriptionInfo> subs = sm.getActiveSubscriptionInfoList();
        if (subs == null || subs.isEmpty()) {
            logDetectionFailure(cursor, "no_active_subscriptions", null);
            return;
        }

        int activeSimCount = subs.size();
        String manufacturer = android.os.Build.MANUFACTURER.toLowerCase();
        int sdkInt = android.os.Build.VERSION.SDK_INT;

        // Method 1: Try standard subscription_id (works on most devices)
        int subId = getIntSafe(cursor, "subscription_id");
        if (subId >= 0) { // Valid subscription IDs are non-negative (INVALID_SUBSCRIPTION_ID = -1)
            if (fillFromSubscriptionId(subs, record, subId)) {
                return; // Success
            }
        }

        // Method 2: Try vendor-specific simid column (OPPO/Realme on Android ≤ 11)
        if (sdkInt <= 30 && (manufacturer.contains("oppo") || manufacturer.contains("realme"))) {
            int simId = getIntSafe(cursor, "simid");
            if (simId >= 0) {
                if (fillFromSimId(context, subs, record, simId, activeSimCount, manufacturer)) {
                    return; // Success
                }
            }
        }

        // Method 3: Try phone number matching (OPPO stores SIM's phone in phone_account_address)
        String phoneAccountAddress = getStringSafe(cursor, "phone_account_address");
        if (phoneAccountAddress != null && !phoneAccountAddress.isEmpty()) {
            if (fillFromPhoneNumber(subs, record, phoneAccountAddress)) {
                return; // Success
            }
        }

        // All methods failed - log for analysis
        logDetectionFailure(cursor, "all_methods_failed", null);
    }

    /**
     * Fill SIM info from standard subscription_id
     */
    private boolean fillFromSubscriptionId(List<SubscriptionInfo> subs, CallRecord record, int subId) {
        for (SubscriptionInfo info : subs) {
            if (info.getSubscriptionId() == subId) {
                record.simSlot = info.getSimSlotIndex();
                record.carrier = info.getCarrierName() != null ? info.getCarrierName().toString() : null;
                return true;
            }
        }
        return false;
    }

    /**
     * Fill SIM info from vendor-specific simid (OPPO/Realme)
     *
     * Known patterns:
     * - OPPO Qualcomm: single SIM (simid=1→slot0), dual SIM (simid=5→slot0, simid=1→slot1)
     * - Realme MediaTek: simid=8→slot0, simid=9→slot1
     */
    private boolean fillFromSimId(Context context, List<SubscriptionInfo> subs, CallRecord record,
                                  int simId, int activeSimCount, String manufacturer) {
        Integer mappedSlot = null;

        // OPPO Qualcomm pattern
        if (manufacturer.contains("oppo")) {
            if (activeSimCount == 1 && simId == 1) {
                mappedSlot = 0; // Single SIM: simid=1 → slot 0
            } else if (activeSimCount == 2) {
                if (simId == 5) mappedSlot = 0; // Dual SIM: simid=5 → slot 0
                else if (simId == 1) mappedSlot = 1; // Dual SIM: simid=1 → slot 1
            }
        }

        // Realme/OPPO MediaTek pattern
        if (manufacturer.contains("realme") || manufacturer.contains("oppo")) {
            if (simId == 8) mappedSlot = 0;
            else if (simId == 9) mappedSlot = 1;
        }

        if (mappedSlot != null) {
            record.simSlot = mappedSlot;
            // Get carrier for this slot
            for (SubscriptionInfo info : subs) {
                if (info.getSimSlotIndex() == mappedSlot) {
                    record.carrier = info.getCarrierName() != null ? info.getCarrierName().toString() : null;
                    break;
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Fill SIM info by matching phone number (OPPO specific)
     */
    private boolean fillFromPhoneNumber(List<SubscriptionInfo> subs, CallRecord record, String phoneNumber) {
        if (phoneNumber.length() < 7) return false; // Too short to be reliable

        String normalized = phoneNumber.replaceAll("[^0-9]", ""); // Remove non-digits

        for (SubscriptionInfo info : subs) {
            String simNumber = info.getNumber();
            if (simNumber != null && !simNumber.isEmpty()) {
                String normalizedSim = simNumber.replaceAll("[^0-9]", "");

                // Check if they match (exact or suffix match for different country code formats)
                if (normalized.equals(normalizedSim) ||
                    normalized.endsWith(normalizedSim) ||
                    normalizedSim.endsWith(normalized)) {

                    record.simSlot = info.getSimSlotIndex();
                    record.carrier = info.getCarrierName() != null ? info.getCarrierName().toString() : null;
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Log detection failure to Crashlytics for analysis
     */
    private void logDetectionFailure(Cursor cursor, String reason, Exception exception) {
        try {
            // Collect diagnostic info
            int subId = getIntSafe(cursor, "subscription_id");
            int simId = getIntSafe(cursor, "simid");
            String phoneAddr = getStringSafe(cursor, "phone_account_address");

            FirebaseCrashlytics crashlytics = FirebaseCrashlytics.getInstance();
            crashlytics.setCustomKey("sim_detection_failure", reason);
            crashlytics.setCustomKey("manufacturer", android.os.Build.MANUFACTURER);
            crashlytics.setCustomKey("model", android.os.Build.MODEL);
            crashlytics.setCustomKey("sdk_int", android.os.Build.VERSION.SDK_INT);
            crashlytics.setCustomKey("subscription_id_value", subId);
            crashlytics.setCustomKey("simid_value", simId);
            crashlytics.setCustomKey("has_phone_account_address", phoneAddr != null && !phoneAddr.isEmpty());

            String logMessage = String.format("SIM detection failed: reason=%s, mfr=%s, model=%s, sdk=%d, subId=%d, simId=%d",
                    reason, android.os.Build.MANUFACTURER, android.os.Build.MODEL,
                    android.os.Build.VERSION.SDK_INT, subId, simId);

            crashlytics.log(logMessage);

            if (exception != null) {
                crashlytics.recordException(exception);
            } else {
                // Record as non-fatal exception to make it visible in dashboard
                crashlytics.recordException(new Exception("SIM_DETECTION_FAILURE: " + logMessage));
            }

        } catch (Exception e) {
            Log.e("SaveCore", "Error logging detection failure", e);
        }
    }

    /**
     * @deprecated Use detectAndFillSimSlot instead
     */
    @Deprecated
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

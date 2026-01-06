package com.calltrack.calltrackapp.monitors;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.provider.CallLog;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.database.Cursor;

import com.calltrack.calltrackapp.constants.DBConst;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;

import java.util.List;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import androidx.core.app.ActivityCompat;
import androidx.room.Room;

public class CallMonitor extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
            String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
            if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
                String incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                Log.d("CallReceiver", "Incoming call: " + incomingNumber);
            } else if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
                Log.d("CallReceiver", "Call answered or outgoing");
            } else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
                Log.d("CallReceiver", "Call ended or missed");
                Executors.newSingleThreadScheduledExecutor().schedule(() -> {
                    saveLatestCall(context);
                }, 2, TimeUnit.SECONDS);
            }
        }
    }

    private void saveLatestCall(Context context) {
        String[] projection = {CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.DATE, CallLog.Calls.DURATION, "subscription_id"};
        Cursor cursor = context.getContentResolver().query(CallLog.Calls.CONTENT_URI, projection, null, null, CallLog.Calls.DATE + " DESC");
        CallRecord record = new CallRecord();
        record.synced = false;
        record.noteSynced = true;
        int numberIndex = Objects.requireNonNull(cursor).getColumnIndex(CallLog.Calls.NUMBER);
        int typeIndex = cursor.getColumnIndex(CallLog.Calls.TYPE);
        int dateIndex = cursor.getColumnIndex(CallLog.Calls.DATE);
        int durationIndex = cursor.getColumnIndex(CallLog.Calls.DURATION);
        int subIdIndex = cursor.getColumnIndex("subscription_id");

        if (cursor.moveToFirst() && numberIndex >= 0) {
            record.number = cursor.getString(numberIndex);
            record.date = cursor.getLong(dateIndex);
            record.duration = cursor.getString(durationIndex);
            switch (cursor.getInt(typeIndex)) {
                case CallLog.Calls.INCOMING_TYPE:
                    record.type = "INCOMING";
                    break;
                case CallLog.Calls.OUTGOING_TYPE:
                    record.type = "OUTGOING";
                    break;
                case CallLog.Calls.MISSED_TYPE:
                    record.type = "MISSED";
                    break;
            }
            if (subIdIndex >= 0) {
                int subId = cursor.getInt(subIdIndex);
                SubscriptionManager sm = (SubscriptionManager) context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
                if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                    List<SubscriptionInfo> subs = sm.getActiveSubscriptionInfoList();
                    for (SubscriptionInfo info : subs) {
                        if (info.getSubscriptionId() == subId) {
                            record.simSlot = info.getSimSlotIndex();
                            record.carrier = info.getCarrierName().toString();
                        }
                    }
                }
            }
            AppDB db = AppDB.getInstance(context);
            TokenEntity te = db.tokenDao().getOne();
            if (te != null && te.simSlots.contains(record.simSlot)) {
                db.callRecordDao().insert(record);
            } else if (te == null) {
                db.callRecordDao().insert(record);
            }
        }
        cursor.close();
    }

}

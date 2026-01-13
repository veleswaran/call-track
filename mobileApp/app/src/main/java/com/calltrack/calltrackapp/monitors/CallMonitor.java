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
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

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
                OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(SaveWorker.class).setInitialDelay(2, TimeUnit.SECONDS).build();
                WorkManager.getInstance(context).enqueue(workRequest);
            }
        }
    }

}

// For future enhancement
//public class CallMonitor extends TelephonyCallback
//    implements TelephonyCallback.CallStateListener {
//
//    private Context context;
//
//    public CallMonitor(Context context) {
//        this.context = context;
//        TelephonyManager telephonyManager =
//            (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
//        telephonyManager.registerTelephonyCallback(
//            context.getMainExecutor(), this);
//    }
//
//    @Override
//    public void onCallStateChanged(int state) {
//        switch (state) {
//            case TelephonyManager.CALL_STATE_RINGING:
//                Log.d("CallReceiver", "Incoming call ringing");
//                break;
//            case TelephonyManager.CALL_STATE_OFFHOOK:
//                Log.d("CallReceiver", "Call answered or outgoing");
//                break;
//            case TelephonyManager.CALL_STATE_IDLE:
//                Log.d("CallReceiver", "Call ended or missed");
//                OneTimeWorkRequest workRequest =
//                    new OneTimeWorkRequest.Builder(SaveWorker.class)
//                        .setInitialDelay(2, TimeUnit.SECONDS)
//                        .build();
//                WorkManager.getInstance(context).enqueue(workRequest);
//                break;
//        }
//    }
//}
//
//<intent-filter>
//    <action android:name="android.intent.action.DIAL" />
//    <action android:name="android.intent.action.CALL" />
//    <action android:name="android.intent.action.CALL_PRIVILEGED" />
//    <category android:name="android.intent.category.DEFAULT" />
//    <category android:name="android.intent.category.BROWSABLE" />
//    <data android:scheme="tel" />
//</intent-filter>
//
//TelecomManager telecomManager =
//    (TelecomManager) context.getSystemService(Context.TELECOM_SERVICE);
//
//if (!context.getPackageName().equals(telecomManager.getDefaultDialerPackage())) {
//Intent intent = new Intent(TelecomManager.ACTION_CHANGE_DEFAULT_DIALER);
//    intent.putExtra(TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME,
//                    context.getPackageName());
//    context.startActivity(intent);
//}





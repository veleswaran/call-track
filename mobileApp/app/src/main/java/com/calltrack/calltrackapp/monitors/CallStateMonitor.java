package com.calltrack.calltrackapp.monitors;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class CallStateMonitor extends TelephonyCallback implements TelephonyCallback.CallStateListener {

    private final Context context;
    private final Executor executor = Executors.newSingleThreadExecutor();

    public CallStateMonitor(Context context) {
        this.context = context;
    }

    @Override
    public void onCallStateChanged(int state) {
        switch (state) {
            case TelephonyManager.CALL_STATE_RINGING:
                Log.d("CallMonitor", "Incoming call ringing");
                break;
            case TelephonyManager.CALL_STATE_OFFHOOK:
                Log.d("CallMonitor", "Call answered or outgoing");
                break;
            case TelephonyManager.CALL_STATE_IDLE:
                Log.d("CallMonitor", "Call ended or missed");
                OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(SaveWorker.class).setInitialDelay(2, TimeUnit.SECONDS).build();
                WorkManager.getInstance(context).enqueue(workRequest);
                executor.execute(() -> {
                    SaveCore sc = new SaveCore(context);
                    sc.ProcessCalls();
                });
                break;
        }
    }

    public void register() {
        TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            tm.registerTelephonyCallback(context.getMainExecutor(), this);
            Log.d("CallMonitorService", "TelephonyCallback registered");
        } else {
            Log.e("CallMonitor", "READ_PHONE_STATE permission not granted");
        }
    }

    public void unregister() {
        TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        tm.unregisterTelephonyCallback(this);
    }
}

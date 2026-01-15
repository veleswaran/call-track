package com.calltrack.calltrackapp.monitors;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

public class CallMonitor extends BroadcastReceiver {
    private final Executor executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Intent serviceIntent = new Intent(context, CallMonitorService.class);
            context.startForegroundService(serviceIntent);
        }
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
                executor.execute(() -> {
                    SaveCore sc = new SaveCore(context);
                    sc.ProcessCalls();
                });
            }
        }
    }
}

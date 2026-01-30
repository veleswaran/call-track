package com.calltrack.calltrackapp.monitors;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class CallStateMonitor {

    private final Context context;
    private final Executor executor = Executors.newSingleThreadExecutor();
    private Object monitor; // TelephonyCallback or PhoneStateListener

    public CallStateMonitor(Context context) {
        this.context = context;
    }

    public void handleCallStateChanged(int state) {
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
        if (tm == null) return;
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                registerModern(tm);
            } else {
                registerLegacy(tm);
            }
            Log.d("CallMonitorService", "Call monitor registered");
        } else {
            Log.e("CallMonitor", "READ_PHONE_STATE permission not granted");
        }
    }

    private void registerModern(TelephonyManager tm) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            TelephonyCallback callback = new ModernMonitor();
            tm.registerTelephonyCallback(context.getMainExecutor(), callback);
            monitor = callback;
        }
    }

    private void registerLegacy(TelephonyManager tm) {
        PhoneStateListener listener = new LegacyMonitor();
        tm.listen(listener, PhoneStateListener.LISTEN_CALL_STATE);
        monitor = listener;
    }

    public void unregister() {
        TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        if (tm == null || monitor == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && monitor instanceof TelephonyCallback) {
            tm.unregisterTelephonyCallback((TelephonyCallback) monitor);
        } else if (monitor instanceof PhoneStateListener) {
            tm.listen((PhoneStateListener) monitor, PhoneStateListener.LISTEN_NONE);
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.S)
    private class ModernMonitor extends TelephonyCallback implements TelephonyCallback.CallStateListener {
        @Override
        public void onCallStateChanged(int state) {
            handleCallStateChanged(state);
        }
    }

    private class LegacyMonitor extends PhoneStateListener {
        @Override
        public void onCallStateChanged(int state, String phoneNumber) {
            handleCallStateChanged(state);
        }
    }

}

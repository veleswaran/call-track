package com.calltrack.calltrackapp.monitors;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class CallMonitorService extends Service {
    public static boolean isRunning = false;
    private CallStateMonitor callStateMonitor;

    @Override
    public void onCreate() {
        super.onCreate();
        isRunning = true;
        // Create notification channel for foreground service
        NotificationChannel channel = new NotificationChannel(
            "call_monitor_channel",
            "Call Monitor",
            NotificationManager.IMPORTANCE_HIGH
        );
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(channel);
        Notification notification = new NotificationCompat.Builder(this, "call_monitor_channel")
            .setContentTitle("Call Tracking Active")
            .setContentText("Monitoring phone calls…")
            .setSmallIcon(android.R.drawable.sym_call_incoming)
            .build();
        startForeground(1, notification);
        callStateMonitor = new CallStateMonitor(this);
        callStateMonitor.register();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        if (callStateMonitor != null) {
            callStateMonitor.unregister();
            Log.d("CallMonitorService", "TelephonyCallback unregistered");
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }
}

package com.calltrack.calltrackapp.monitors;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.EventRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;

import java.time.Instant;
import java.time.LocalTime;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class CallMonitorService extends Service {
    public static boolean isRunning = false;
    private CallStateMonitor callStateMonitor;

    private final Executor executor = Executors.newSingleThreadExecutor();

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
            .setOngoing(true)
            .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(1, notification);
        }
        callStateMonitor = new CallStateMonitor(this);
        callStateMonitor.register();
//        executor.execute(() -> {
//            AppDB db = AppDB.getInstance(this);
//            EventRecord er = new EventRecord();
//            er.event_type = "APP_STARTED";
//            er.occurred_at = Instant.now().toString();
//            db.eventDAO().insert(er);
//        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP_SERVICE".equals(intent.getAction())) {
            Context appContext = getApplicationContext();
            executor.execute(() -> {
                AppDB db = AppDB.getInstance(appContext);
                EventRecord er = new EventRecord();
                er.event_type = "APP_STOPPED";
                er.occurred_at = Instant.now().toString();
                db.eventDAO().insert(er);
            });
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        if (callStateMonitor != null) {
            callStateMonitor.unregister();
            Log.d("CallMonitorService", "TelephonyCallback unregistered");
        }
        Context appContext = getApplicationContext();
        executor.execute(() -> {
            AppDB db = AppDB.getInstance(appContext);
            EventRecord er = new EventRecord();
            er.event_type = "APP_STOPPED";
            er.occurred_at = Instant.now().toString();
            db.eventDAO().insert(er);
        });
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Not a bound service
    }
}

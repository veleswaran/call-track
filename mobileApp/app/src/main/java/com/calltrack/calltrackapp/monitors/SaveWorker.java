package com.calltrack.calltrackapp.monitors;

import android.Manifest;
import android.app.Notification;
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
import com.calltrack.calltrackapp.utilities.Utility;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.work.ForegroundInfo;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class SaveWorker extends Worker {

    private static final String CHANNEL_ID = "save_channel";

    public SaveWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        SaveCore sc = new SaveCore(context);
        sc.ProcessCalls();
        return Result.success();
    }


    @NonNull
    @Override
    public ForegroundInfo getForegroundInfo() {
        Notification notification = new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
            .setContentTitle("Saving data")
            .setContentText("Data is being saved...")
            .setSmallIcon(android.R.drawable.ic_menu_save) // replace with your own icon
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build();
        return new ForegroundInfo(1, notification);
    }
}

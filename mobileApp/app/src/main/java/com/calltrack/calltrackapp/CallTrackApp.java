package com.calltrack.calltrackapp;

import android.app.Application;
import android.util.Log;

import com.calltrack.calltrackapp.syncer.CallSyncer;

import java.util.concurrent.TimeUnit;

import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

public class CallTrackApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        Constraints constraints = new Constraints.Builder() .setRequiredNetworkType(NetworkType.CONNECTED) .build();
        PeriodicWorkRequest workRequest = new PeriodicWorkRequest.Builder(CallSyncer.class, 15, TimeUnit.MINUTES).setConstraints(constraints).build();
        WorkManager.getInstance(this).enqueueUniquePeriodicWork("CallSyncer", ExistingPeriodicWorkPolicy.UPDATE, workRequest);
    }
}

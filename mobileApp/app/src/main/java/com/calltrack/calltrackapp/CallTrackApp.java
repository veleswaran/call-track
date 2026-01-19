package com.calltrack.calltrackapp;

import android.app.Application;
import android.util.Log;

import com.calltrack.calltrackapp.syncer.CallSyncer;

import java.util.concurrent.TimeUnit;

import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

public class CallTrackApp extends Application {

    @Override
    public void onCreate() {
        super.onCreate();
        PeriodicWorkRequest workRequest = new PeriodicWorkRequest.Builder(CallSyncer.class, 5, TimeUnit.MINUTES).build();
        WorkManager.getInstance(this).enqueueUniquePeriodicWork("CallSyncer", ExistingPeriodicWorkPolicy.UPDATE, workRequest);
    }
}

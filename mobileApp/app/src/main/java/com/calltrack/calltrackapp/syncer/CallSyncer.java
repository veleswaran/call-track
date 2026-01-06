package com.calltrack.calltrackapp.syncer;

import android.content.Context;
import android.util.Log;

import com.calltrack.calltrackapp.api.CallLogApi;
import com.calltrack.calltrackapp.constants.DBConst;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;

import java.util.List;

import androidx.annotation.NonNull;
import androidx.room.Room;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

public class CallSyncer extends Worker {

    private final CallLogApi api = new CallLogApi();

    public CallSyncer(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        AppDB db = Room.databaseBuilder(context, AppDB.class, DBConst.DB_NAME).build();
        long twoWeeksAgo = System.currentTimeMillis() - (20L * 24 * 60 * 60 * 1000);
        db.callRecordDao().deleteSynced(twoWeeksAgo);
        List<CallRecord> unsynced = db.callRecordDao().getUnsyncedRecords();
        if(!unsynced.isEmpty()){
            if (api.send(unsynced, context)) {
                for (CallRecord record : unsynced) {
                    record.synced = true;
                }
                db.callRecordDao().updateAll(unsynced);
            }
        }
        return Result.success();
    }
}



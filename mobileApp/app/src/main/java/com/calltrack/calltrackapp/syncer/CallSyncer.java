package com.calltrack.calltrackapp.syncer;

import android.content.Context;
import android.util.Log;

import com.calltrack.calltrackapp.api.ApiUtilities;
import com.calltrack.calltrackapp.api.CallLogsApi;
import com.calltrack.calltrackapp.api.EventApi;
import com.calltrack.calltrackapp.bundles.CallLogExtra;
import com.calltrack.calltrackapp.bundles.CallLogItem;
import com.calltrack.calltrackapp.bundles.CallLogRequest;
import com.calltrack.calltrackapp.bundles.CallLogResponse;
import com.calltrack.calltrackapp.bundles.EventPayload;
import com.calltrack.calltrackapp.bundles.EventResponse;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.EventRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.utilities.Utility;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import retrofit2.Call;
import retrofit2.Response;

public class CallSyncer extends Worker {

    public CallSyncer(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Log.d("CallSyncer", "Action called");
        Context context = getApplicationContext();
        AppDB db = AppDB.getInstance(context);
        long twoWeeksAgo = System.currentTimeMillis() - (20L * 24 * 60 * 60 * 1000);
        db.callRecordDao().deleteSynced(twoWeeksAgo);
        List<CallRecord> unsynced = db.callRecordDao().getUnsyncedRecords();
        if (callAPi(context, db, unsynced)) {
            for (CallRecord record : unsynced) {
                record.synced = true;
            }
            db.callRecordDao().updateAll(unsynced);
        }
        List<EventRecord> ers = db.eventDAO().getUnsyncedRecords();
        EventApi ev = ApiUtilities.getEventApi();
        TokenEntity te = db.tokenDao().getOne();
        if (te != null) {
            for (EventRecord evr : ers) {
                EventPayload ep = new EventPayload();
                ep.event_type = evr.event_type;
                ep.occurred_at = evr.occurred_at;
                Call<EventResponse> res = ev.register(te.token, ep);
                try {
                    Response<EventResponse> response = res.execute(); // synchronous
                    Log.d("Event Api response", String.valueOf(response.code()));
                    Log.d("Event Api response", response.body().toString());
                    if (response.isSuccessful()) {
                        evr.synced = true;
                        db.eventDAO().update(evr);
                    }
                } catch (IOException e) {
                    Log.d("Error", e.toString());
                }
            }
        }
        return Result.success();
    }

    boolean callAPi(Context context, AppDB db, List<CallRecord> records) {
        TokenEntity te = db.tokenDao().getOne();
        if (te == null) {
            return false;
        }
        try {
            String uuid = Utility.getOrCreateUUID(context);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            List<CallLogItem> items = new ArrayList<>();
            for (CallRecord record : records) {
                Date date = new Date(record.date);
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault());
                String formatted = sdf.format(date);
                byte[] hashBytes = digest.digest((uuid + record.date + record.type + record.simSlot + record.number).getBytes(StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hashBytes) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                CallLogItem cli = recordToLog(record);
                cli.timestamp = formatted;
                cli.id = te.code + "-" + record.id;
                cli.call_hash = hexString.toString();
                items.add(cli);
            }
            CallLogRequest payload = new CallLogRequest(items);
            payload.battery_level = Utility.getBatteryPercentage(context);
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            String jsonString = gson.toJson(payload);
//            Log.d("REQUEST_PAYLOAD", jsonString);
            CallLogsApi service = ApiUtilities.getCallLogsApi();
            Call<CallLogResponse> call = service.syncCallLogs(te.token, payload);
            Response<CallLogResponse> response = call.execute(); // synchronous
            String responseJson = gson.toJson(response.body());
//            Log.d("RESPONSE", responseJson);
            Log.d("CallLogApi", "Response code: " + response.code());
            return response.isSuccessful();
        } catch (Exception e) {
            Log.e("CallSyncer -> callAPi", "Exception occurred", e);
        }
        return true;
    }

    CallLogItem recordToLog(CallRecord record) {
        CallLogItem item = new CallLogItem();
        item.phone_number = record.number;
        item.direction = record.type;
        item.duration = record.duration;
        item.sim_slot = record.simSlot;
        item.carrier = record.carrier;
        item.phone_contact_name = record.phoneContactName;
        CallLogExtra extra = new CallLogExtra();
        extra.battery_level = record.batteryLevel;
        extra.metadata = record.metaData;
        extra.classification = record.category;
        if (extra.classification == null || Objects.equals(extra.classification, "")) {
            extra.classification = "BUSINESS";
        }
        extra.note = record.notes;
        item.extra = extra;
        return item;
    }

}



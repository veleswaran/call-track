package com.calltrack.calltrackapp.api;

import android.content.Context;
import android.provider.Settings;
import android.util.Log;

import com.calltrack.calltrackapp.MainActivity;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.utilities.Utility;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import androidx.annotation.NonNull;

public class CallLogApi {

    private static final String API = "https://api-calltrack.altalya.in/api/v1/call-logs/sync";

    public boolean send(List<CallRecord> records, Context context) {
        try {
            AppDB db = AppDB.getInstance(context);
            TokenEntity te = db.tokenDao().getOne();
            if (te != null) {
                URL url = new URL(API);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("X-Device-Token", te.token);
                conn.setDoOutput(true);
                JSONObject payload = getJsonObject(records, context);

                StringBuilder requestString = new StringBuilder();
                requestString.append(conn.getRequestMethod())
                        .append(" ")
                        .append(url.toString())
                        .append("\n");

                Map<String, List<String>> headers = conn.getRequestProperties();
                for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
                    requestString.append(entry.getKey())
                            .append(": ")
                            .append(String.join(",", entry.getValue()))
                            .append("\n");
                }

                requestString.append("\n"); // separate headers from body
                requestString.append(payload.toString());

                Log.d("REQUEST", requestString.toString());
                System.out.println(requestString.toString());

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }
                Log.d("Response", conn.getResponseMessage());
                return conn.getResponseCode() == 200;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @NonNull
    private static JSONObject getJsonObject(List<CallRecord> records, Context context) throws JSONException {
        JSONObject payload = new JSONObject();
        try {
            JSONArray jsonArray = new JSONArray();
            String uuid = Utility.getOrCreateUUID(context);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            for (CallRecord record : records) {
                Date date = new Date(record.date);
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'",Locale.getDefault());
                String formatted = sdf.format(date);

                byte[] hashBytes = digest.digest((uuid + record.date + record.type + record.simSlot + record.number).getBytes(StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hashBytes) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                JSONObject json = new JSONObject();
                json.put("phone_number", record.number);
                json.put("direction", record.type);
                json.put("timestamp", formatted);
                json.put("duration", record.duration);
                json.put("sim_slot", record.simSlot);
                json.put("carrier", record.carrier);
                json.put("id", "prefix-" + record.id);
                json.put("call_hash", hexString.toString());
                jsonArray.put(json);
            }
            payload.put("logs", jsonArray);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return payload;
    }

}




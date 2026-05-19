package com.calltrack.calltrackapp.utilities;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.calltrack.calltrackapp.api.ApiUtilities;
import com.calltrack.calltrackapp.api.DeviceApi;
import com.calltrack.calltrackapp.bundles.FcmTokenRequest;
import com.calltrack.calltrackapp.bundles.FcmTokenResponse;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.settings.LocalSettings;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class FcmTokenUploader {

    private static final String TAG = "FcmTokenUploader";

    public static void uploadToken(Context context, String fcmToken) {
        AppDB db = AppDB.getInstance(context);
        TokenEntity te = db.tokenDao().getOne();

        if (te == null) {
            Log.d(TAG, "Device not registered, skipping FCM token upload");
            return;
        }

        DeviceApi api = ApiUtilities.getDeviceApi();
        FcmTokenRequest request = new FcmTokenRequest(fcmToken);

        api.sendFcmToken(te.token, request).enqueue(new Callback<FcmTokenResponse>() {
            @Override
            public void onResponse(@NonNull Call<FcmTokenResponse> call, @NonNull Response<FcmTokenResponse> response) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "FCM token uploaded successfully");
                    LocalSettings settings = new LocalSettings(context);
                    settings.setFcmTokenSent(true);
                } else {
                    Log.e(TAG, "Failed to upload FCM token: " + response.code());
                }
            }

            @Override
            public void onFailure(@NonNull Call<FcmTokenResponse> call, @NonNull Throwable t) {
                Log.e(TAG, "Error uploading FCM token", t);
            }
        });
    }
}

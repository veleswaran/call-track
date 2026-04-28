package com.calltrack.calltrackapp.services;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.calltrack.calltrackapp.MainActivity;
import com.calltrack.calltrackapp.R;
import com.calltrack.calltrackapp.api.ApiUtilities;
import com.calltrack.calltrackapp.api.DeviceApi;
import com.calltrack.calltrackapp.bundles.FcmTokenRequest;
import com.calltrack.calltrackapp.bundles.FcmTokenResponse;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.settings.LocalSettings;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String CHANNEL_ID = "calltrack_notifications";
    private static final String TAG = "FCMService";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM token: " + token);
        sendTokenToServer(token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        super.onMessageReceived(message);
        Log.d(TAG, "Message received from: " + message.getFrom());

        if (message.getNotification() != null) {
            showNotification(
                message.getNotification().getTitle(),
                message.getNotification().getBody()
            );
        }
    }

    private void sendTokenToServer(String token) {
        AppDB db = AppDB.getInstance(getApplicationContext());
        TokenEntity te = db.tokenDao().getOne();

        if (te == null) {
            Log.d(TAG, "Device not registered, skipping FCM token sync");
            return;
        }

        DeviceApi api = ApiUtilities.getDeviceApi();
        FcmTokenRequest request = new FcmTokenRequest(token);

        api.sendFcmToken(te.token, request).enqueue(new Callback<FcmTokenResponse>() {
            @Override
            public void onResponse(@NonNull Call<FcmTokenResponse> call, @NonNull Response<FcmTokenResponse> response) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "FCM token sent successfully");
                    LocalSettings settings = new LocalSettings(getApplicationContext());
                    settings.setFcmTokenSent(true);
                } else {
                    Log.e(TAG, "Failed to send FCM token: " + response.code());
                }
            }

            @Override
            public void onFailure(@NonNull Call<FcmTokenResponse> call, @NonNull Throwable t) {
                Log.e(TAG, "Error sending FCM token", t);
            }
        });
    }

    private void showNotification(String title, String body) {
        createNotificationChannel();

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true);

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify((int) System.currentTimeMillis(), builder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "CallTrack Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for missed calls and device status");

            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
}

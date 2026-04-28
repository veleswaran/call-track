package com.calltrack.calltrackapp;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import com.calltrack.calltrackapp.Adapters.CallRecordAdapter;
import com.calltrack.calltrackapp.api.ApiUtilities;
import com.calltrack.calltrackapp.api.DeviceApi;
import com.calltrack.calltrackapp.bundles.FcmTokenRequest;
import com.calltrack.calltrackapp.bundles.FcmTokenResponse;
import com.calltrack.calltrackapp.bundles.RegistrationRequest;
import com.calltrack.calltrackapp.bundles.RegistrationResponse;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.monitors.CallMonitorService;
import com.calltrack.calltrackapp.settings.LocalSettings;
import com.calltrack.calltrackapp.syncer.CallSyncer;
import com.calltrack.calltrackapp.utilities.Utility;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import com.google.firebase.messaging.FirebaseMessaging;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {
    private static final int REQUEST_CODE = 100;
    private RecyclerView recyclerView;
    private CallRecordAdapter adapter;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d("onCreate", "MainActivity");
        String[] permissions = getPermissions();
        boolean granted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                granted = false;
                break;
            }
        }
        if (!granted) {
            ActivityCompat.requestPermissions(this, permissions, REQUEST_CODE);
        } else {
            showIntent();
        }

    }

    private static String[] getPermissions() {
        String[] permissions;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34
            permissions = new String[]{Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG,
                Manifest.permission.FOREGROUND_SERVICE, Manifest.permission.FOREGROUND_SERVICE_PHONE_CALL,
                Manifest.permission.POST_NOTIFICATIONS
            };
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // API 33
            permissions = new String[]{Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG,
                Manifest.permission.POST_NOTIFICATIONS
            };
        } else {
            permissions = new String[]{Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG
            };
        }
        return permissions;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (allGranted) {
                showIntent();
            } else {
                Toast.makeText(this, "Required permissions not granted. Closing app.", Toast.LENGTH_LONG).show();
                finishAffinity();
                System.exit(0);
            }
        }
    }

    private void showIntent() {
        setContentView(R.layout.activity_main);
        EdgeToEdge.enable(this);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        AppDB db = AppDB.getInstance(this);
        db.callRecordDao().getAll().observe(this, records -> {
            if (adapter == null) {
                adapter = new CallRecordAdapter(records, rec -> {
                    executor.execute(() -> {
                        db.callRecordDao().update(rec);
                    });
                });
                recyclerView.setLayoutManager(new LinearLayoutManager(this));
                recyclerView.setAdapter(adapter);
            } else {
                adapter.updateData(records);
            }
        });
        WorkManager workManager = WorkManager.getInstance(this);
        OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(CallSyncer.class).build();
        workManager.enqueueUniqueWork("startupWorker", ExistingWorkPolicy.REPLACE, workRequest);
        if (!CallMonitorService.isRunning) {
            Intent serviceIntent = new Intent(this, CallMonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        }
        syncFcmToken();
    }

    private void syncFcmToken() {
        LocalSettings settings = new LocalSettings(this);
        if (settings.isFcmTokenSent()) {
            return;
        }

        executor.execute(() -> {
            AppDB db = AppDB.getInstance(this);
            TokenEntity te = db.tokenDao().getOne();
            if (te == null) {
                return;
            }

            FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.e("MainActivity", "Failed to get FCM token", task.getException());
                    return;
                }

                String token = task.getResult();
                DeviceApi api = ApiUtilities.getDeviceApi();
                FcmTokenRequest request = new FcmTokenRequest(token);

                api.sendFcmToken(te.token, request).enqueue(new Callback<FcmTokenResponse>() {
                    @Override
                    public void onResponse(@NonNull Call<FcmTokenResponse> call, @NonNull Response<FcmTokenResponse> response) {
                        if (response.isSuccessful()) {
                            settings.setFcmTokenSent(true);
                            Log.d("MainActivity", "FCM token sent successfully");
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call<FcmTokenResponse> call, @NonNull Throwable t) {
                        Log.e("MainActivity", "Failed to send FCM token", t);
                    }
                });
            });
        });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main_menu, menu);
        AppDB db = AppDB.getInstance(this);
        db.tokenDao().getToken().observe(this, token -> {
            if (token != null) {
                menu.findItem(R.id.action_register).setVisible(false);
                menu.findItem(R.id.action_sync).setVisible(true);
            } else {
                menu.findItem(R.id.action_register).setVisible(true);
                menu.findItem(R.id.action_sync).setVisible(false);
            }
        });
        return true;
    }


    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();
        if (id == R.id.action_register) {
            showRegistrationDialog();
            return true;
        } else if (id == R.id.action_sync) {
            triggerManualSync();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void triggerManualSync() {
        Toast.makeText(this, "Starting manual sync...", Toast.LENGTH_SHORT).show();
        OneTimeWorkRequest saveWork = new OneTimeWorkRequest.Builder(com.calltrack.calltrackapp.monitors.SaveWorker.class)
            .setExpedited(androidx.work.OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build();
        OneTimeWorkRequest syncWork = new OneTimeWorkRequest.Builder(CallSyncer.class)
            .setExpedited(androidx.work.OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build();
        WorkManager.getInstance(this).beginWith(saveWork).then(syncWork).enqueue();
        WorkManager.getInstance(this).getWorkInfoByIdLiveData(syncWork.getId())
            .observe(this, workInfo -> {
                if (workInfo != null) {
                    if (workInfo.getState() == androidx.work.WorkInfo.State.SUCCEEDED) {
                        Toast.makeText(MainActivity.this, "Sync Successful!", Toast.LENGTH_LONG).show();
                    } else if (workInfo.getState() == androidx.work.WorkInfo.State.FAILED) {
                        Toast.makeText(MainActivity.this, "Sync Failed. Check Internet.", Toast.LENGTH_LONG).show();
                    } else if (workInfo.getState() == androidx.work.WorkInfo.State.RUNNING) {
                        Toast.makeText(MainActivity.this, "Syncing...", Toast.LENGTH_SHORT).show();
                    }
                }
            });
    }


    private void showRegistrationDialog() {
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogView = inflater.inflate(R.layout.dialog_register, null);
        EditText input = dialogView.findViewById(R.id.input_code);
        SubscriptionManager sm = (SubscriptionManager) getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        List<SubscriptionInfo> subs = sm.getActiveSubscriptionInfoList();
        List<Integer> simSlots = new ArrayList<>();
        for (SubscriptionInfo info : subs) {
            simSlots.add(info.getSimSlotIndex()); // 0, 1, etc.
        }
        String[] simOptions = new String[simSlots.size()];
        for (int i = 0; i < simSlots.size(); i++) {
            simOptions[i] = "SIM " + simSlots.get(i);
        }
        boolean[] checkedItems = new boolean[simOptions.length];
        List<Integer> selectedSlots = new ArrayList<>();
        AlertDialog dialog = new AlertDialog.Builder(this).setTitle("Register").setView(dialogView)
            .setMultiChoiceItems(simOptions, checkedItems, (d, which, isChecked) -> {
                if (isChecked) {
                    selectedSlots.add(simSlots.get(which));
                } else {
                    selectedSlots.remove(Integer.valueOf(simSlots.get(which)));
                }
            })
            .setPositiveButton("Submit", null) // set null for now
            .setNegativeButton("Cancel", null)
            .create();
        dialog.show();
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String code = input.getText().toString();
            if (code.isEmpty()) {
                Toast.makeText(this, "Code cannot be empty", Toast.LENGTH_SHORT).show();
                return;
            }
            if (selectedSlots.isEmpty()) {
                Toast.makeText(this, "Please select at least one SIM slot", Toast.LENGTH_SHORT).show();
                return;
            }
            callRegistrationApi(code, selectedSlots);
            dialog.dismiss();
        });

    }


    private void callRegistrationApi(String code, List<Integer> selectedSlots) {
        String uuid = Utility.getOrCreateUUID(this);
        String name = Build.BRAND + " " + Build.DEVICE;
        String model = Build.MODEL;
        String os = Build.VERSION.RELEASE;
        String appVersion = BuildConfig.VERSION_NAME;
        String metadata = Utility.getDeviceInfo(this);
        RegistrationRequest request = new RegistrationRequest(
            code, uuid, name, model, os, appVersion, metadata, selectedSlots
        );
        DeviceApi api = ApiUtilities.getDeviceApi();
        api.register(request).enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<RegistrationResponse> call, @NonNull Response<RegistrationResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    String token = response.body().token;
                    executor.execute(() -> {
                        AppDB db = AppDB.getInstance(MainActivity.this);
                        db.tokenDao().deleteAll();
                        db.tokenDao().insert(new TokenEntity(token, selectedSlots, code));
                        new LocalSettings(MainActivity.this).setToCurrentCallId();
                    });
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "Registration successful", Toast.LENGTH_SHORT).show();
                        invalidateOptionsMenu(); // refresh menu
                    });
                } else {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "Registration failed", Toast.LENGTH_SHORT).show());
                }
            }

            @Override
            public void onFailure(Call<RegistrationResponse> call, Throwable t) {
                Log.d("callRegistrationApi", "error: " + t.getMessage());
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Error: " + t.getMessage(), Toast.LENGTH_LONG).show());
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
    }
}

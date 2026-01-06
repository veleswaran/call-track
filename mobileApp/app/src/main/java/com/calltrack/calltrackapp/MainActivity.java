package com.calltrack.calltrackapp;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;

import com.calltrack.calltrackapp.Adapters.CallRecordAdapter;
import com.calltrack.calltrackapp.api.ApiUtilities;
import com.calltrack.calltrackapp.api.DeviceApi;
import com.calltrack.calltrackapp.bundles.RegistrationRequest;
import com.calltrack.calltrackapp.bundles.RegistrationResponse;
import com.calltrack.calltrackapp.constants.DBConst;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.syncer.CallSyncer;
import com.calltrack.calltrackapp.utilities.Utility;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
import androidx.room.Room;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {
    private static final int REQUEST_CODE = 100;
    private RecyclerView recyclerView;
    private CallRecordAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d("onCreate", "MainActivity");
        // Check and request permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {

            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_PHONE_STATE, Manifest.permission.READ_CALL_LOG},
                    REQUEST_CODE);
        } else {
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
                        Executors.newSingleThreadExecutor().execute(() -> {
                            db.callRecordDao().update(rec);
                        });
                    });
                    recyclerView.setLayoutManager(new LinearLayoutManager(this));
                    recyclerView.setAdapter(adapter);
                } else {
                    adapter.updateData(records);
                }
            });
//            WorkManager workManager = WorkManager.getInstance(this);
//            OneTimeWorkRequest workRequest = new OneTimeWorkRequest.Builder(CallSyncer.class).build();
//            workManager.enqueueUniqueWork("startupWorker", ExistingWorkPolicy.REPLACE, workRequest);

        }

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
                setContentView(R.layout.activity_main);
            } else {
                Toast.makeText(this, "Required permissions not granted. Closing app.", Toast.LENGTH_LONG).show();
                finishAffinity();
                System.exit(0);
            }
        }
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main_menu, menu);

        AppDB db = AppDB.getInstance(this);
        db.tokenDao().getToken().observe(this, token -> {
            if (token != null) {
                menu.findItem(R.id.action_register).setVisible(false);
                menu.findItem(R.id.action_deregister).setVisible(true);
            } else {
                menu.findItem(R.id.action_register).setVisible(true);
                menu.findItem(R.id.action_deregister).setVisible(false);
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
        } else if (id == R.id.action_deregister) {
            confirmDeregister();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }


    private void showRegistrationDialog() {
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogView = inflater.inflate(R.layout.dialog_register, null);

        EditText input = dialogView.findViewById(R.id.input_code);

        // Get SIM slot values
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

        new AlertDialog.Builder(this)
                .setTitle("Register")
                .setView(dialogView)
                .setMultiChoiceItems(simOptions, checkedItems, (dialog, which, isChecked) -> {
                    if (isChecked) {
                        selectedSlots.add(simSlots.get(which));
                    } else {
                        selectedSlots.remove(Integer.valueOf(simSlots.get(which)));
                    }
                })
                .setPositiveButton("Submit", (dialog, which) -> {
                    String code = input.getText().toString();
                    callRegistrationApi(code, selectedSlots);
                })
                .setNegativeButton("Cancel", null)
                .show();
    }


    private void callRegistrationApi(String code, List<Integer> selectedSlots) {
        TelephonyManager telephonyManager = (TelephonyManager) MainActivity.this.getSystemService(TELEPHONY_SERVICE);
        int simSlots = telephonyManager.getPhoneCount();
        String uuid = UUID.randomUUID().toString();
        String name = Build.DEVICE;
        String model = Build.MODEL;
        String os = Build.VERSION.RELEASE;
        String appVersion = "1.0";
        RegistrationRequest request = new RegistrationRequest(
                code, uuid, name, model, os, appVersion, selectedSlots
        );
        DeviceApi api = ApiUtilities.getDeviceApi();

        api.register(request).enqueue(new Callback<RegistrationResponse>() {
            @Override
            public void onResponse(@NonNull Call<RegistrationResponse> call, @NonNull Response<RegistrationResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Log.d("callRegistrationApi", "Body: " + response.raw().body().toString());
                    String token = response.body().token;
                    Executors.newSingleThreadExecutor().execute(() -> {
                        AppDB db = AppDB.getInstance(MainActivity.this);
                        db.tokenDao().deleteAll();
                        db.tokenDao().insert(new TokenEntity(token, selectedSlots));
                    });
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "Registration successful", Toast.LENGTH_SHORT).show();
                        invalidateOptionsMenu(); // refresh menu to show Deregister
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

    private void confirmDeregister() {
        new AlertDialog.Builder(this)
                .setTitle("Confirm Deregistration")
                .setMessage("Are you sure you want to deregister? This will delete all tokens.")
                .setPositiveButton("Yes", (dialog, which) -> {
                    deregister();
                })
                .setNegativeButton("No", (dialog, which) -> {
                    dialog.dismiss();
                })
                .show();
    }


    private void deregister() {
        Executors.newSingleThreadExecutor().execute(() -> {
            AppDB db = AppDB.getInstance(this);
            db.tokenDao().deleteAll();
            runOnUiThread(() -> {
                invalidateOptionsMenu();
                Toast.makeText(this, "Deregistered", Toast.LENGTH_SHORT).show();
            });
        });
    }


}
package com.calltrack.calltrackapp.Adapters;

import android.app.AlertDialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.calltrack.calltrackapp.R;
import com.calltrack.calltrackapp.db.AppDB;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.PhoneNumberCategory;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

public class CallRecordAdapter extends RecyclerView.Adapter<CallRecordAdapter.ViewHolder> {

    private List<CallRecord> records;
    private final OnRecordUpdatedListener listener;

    public interface OnRecordUpdatedListener {
        void onRecordUpdated(CallRecord record);
    }

    public CallRecordAdapter(List<CallRecord> records, OnRecordUpdatedListener listener) {
        this.records = records;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_call_record, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Context context = holder.itemView.getContext();
        CallRecord record = records.get(position);
        holder.tvNumber.setText(record.number);
        if (!isEmpty(record.phoneContactName)) {
            holder.tvContactName.setText(record.phoneContactName);
            holder.tvContactName.setVisibility(View.VISIBLE);
        } else {
            holder.tvContactName.setVisibility(View.GONE);
        }
        holder.tvDate.setText(formatDate(record.date));
        holder.tvType.setText(record.type);
        holder.tvCategory.setText(isEmpty(record.category) ? "No category" : record.category);
        applyCallTypeStyle(context, holder, record.type);
        // Sync Status
        if (record.synced) {
            holder.ivSynced.setImageResource(android.R.drawable.stat_sys_upload_done);
            holder.ivSynced.setColorFilter(ContextCompat.getColor(context, R.color.success));
        } else {
            holder.ivSynced.setImageResource(android.R.drawable.stat_sys_upload);
            holder.ivSynced.setColorFilter(ContextCompat.getColor(context, R.color.warning));
        }
        holder.itemView.setOnClickListener(v -> showDetailsDialog(context, record, position));
    }

    @Override
    public int getItemCount() {
        return records != null ? records.size() : 0;
    }

    private String formatDate(Long millis) {
        if (millis == null || millis == 0) return "";
        Date date = new Date(millis);
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
        return sdf.format(date);
    }

    public void updateData(List<CallRecord> newRecords) {
        this.records = newRecords;
        notifyDataSetChanged();
    }

    private void applyCallTypeStyle(Context context, ViewHolder holder, String type) {
        int colorRes;
        int iconRes;
        switch (type) {
            case "INCOMING":
                colorRes = R.color.call_incoming;
                iconRes = android.R.drawable.sym_call_incoming;
                break;
            case "OUTGOING":
                colorRes = R.color.call_outgoing;
                iconRes = android.R.drawable.sym_call_outgoing;
                break;
            case "MISSED":
                colorRes = R.color.call_missed;
                iconRes = android.R.drawable.sym_call_missed;
                break;
            case "REJECTED":
                colorRes = R.color.call_missed;
                iconRes = android.R.drawable.ic_delete;
                break;
            case "BLOCKED":
                colorRes = R.color.black;
                iconRes = android.R.drawable.ic_menu_close_clear_cancel;
                break;
            default:
                colorRes = R.color.black;
                iconRes = android.R.drawable.ic_menu_call;
                break;
        }
        int color = ContextCompat.getColor(context, colorRes);
        holder.ivCallType.setImageResource(iconRes);
        holder.ivCallType.setColorFilter(color);
        holder.tvType.getBackground().setTint(color);
    }

    private void showDetailsDialog(Context context, CallRecord record, int position) {
        View dialogView = LayoutInflater.from(context).inflate(R.layout.dialog_call_details, null);
        setTextOrDefault(dialogView, R.id.tvDetailNumber, record.number, "-");
        setTextOrDefault(dialogView, R.id.tvDetailType, record.type, "-");
        setTextOrDefault(dialogView, R.id.tvDetailDate, formatDate(record.date), "-");
        setTextOrDefault(dialogView, R.id.tvDetailDuration, record.duration, "-");
        setTextOrDefault(dialogView, R.id.tvDetailSimSlot,
            record.simSlot == null ? "-" : String.valueOf(record.simSlot), "-");
        setTextOrDefault(dialogView, R.id.tvDetailCarrier, record.carrier, "-");
        setTextOrDefault(dialogView, R.id.tvDetailCategory,
            isEmpty(record.category) ? "Not set" : record.category, "Not set");
        setTextOrDefault(dialogView, R.id.tvDetailNotes,
            isEmpty(record.notes) ? "Not set" : record.notes, "Not set");
        setTextOrDefault(dialogView, R.id.tvSynced, record.synced ? "Synced" : "Not synced", "Not synced");
        AlertDialog.Builder builder = new AlertDialog.Builder(context)
            .setTitle("Call Details")
            .setView(dialogView)
            .setPositiveButton("OK", null);
        builder.setNeutralButton("Edit Notes", (dialog, which) -> showEditNotesDialog(context, record, position));
        builder.setNegativeButton("Set Category", (dialog, which) -> showCategoryDialog(context, record, position));
        builder.show();
    }

    private void showEditNotesDialog(Context context, CallRecord record, int position) {
        EditText input = new EditText(context);
        input.setHint("Enter notes");
        input.setText(record.notes);
        new AlertDialog.Builder(context)
            .setTitle("Add Notes")
            .setView(input)
            .setPositiveButton("Save", (d, w) -> {
                record.notes = input.getText().toString();
                record.synced = false;
                listener.onRecordUpdated(record);
                notifyItemChanged(position);
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void showCategoryDialog(Context context, CallRecord record, int position) {
        String[] options = {"BUSINESS", "PERSONAL", "IGNORED"};

        // Find current selection index for showing a checkmark
        int currentSelection = -1;
        for (int i = 0; i < options.length; i++) {
            if (options[i].equals(record.category)) {
                currentSelection = i;
                break;
            }
        }

        new AlertDialog.Builder(context)
            .setTitle("Select Category")
            .setSingleChoiceItems(options, currentSelection, (d, idx) -> {
                String selectedCategory = options[idx];
                record.category = selectedCategory;
                record.synced = false;

                // Save the category preference for this phone number
                saveCategoryPreference(context, record.number, selectedCategory);

                listener.onRecordUpdated(record);
                notifyItemChanged(position);
                d.dismiss();
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    /**
     * Save the category preference for a phone number.
     * This will be used to auto-apply the category to future calls from this number.
     *
     * @param context The context
     * @param phoneNumber The phone number
     * @param category The selected category ("BUSINESS", "PERSONAL", or "IGNORED")
     */
    private void saveCategoryPreference(Context context, String phoneNumber, String category) {
        if (phoneNumber == null || phoneNumber.isEmpty() || category == null || category.isEmpty()) {
            return;
        }

        // Save in background thread to avoid blocking UI
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                AppDB db = AppDB.getInstance(context.getApplicationContext());

                // Create or update the preference
                PhoneNumberCategory preference = new PhoneNumberCategory();
                preference.phoneNumber = phoneNumber;
                preference.normalizedNumber = PhoneNumberCategory.normalizePhoneNumber(phoneNumber);
                preference.category = category;
                preference.lastUpdated = System.currentTimeMillis();

                // Insert or replace (will update if exists due to REPLACE conflict strategy)
                db.phoneNumberCategoryDao().insert(preference);

                android.util.Log.d("CallRecordAdapter",
                    "Saved category preference: " + phoneNumber +
                    " (normalized: " + preference.normalizedNumber + ") → " + category);

            } catch (Exception e) {
                android.util.Log.e("CallRecordAdapter",
                    "Error saving category preference for " + phoneNumber, e);
            }
        });
    }

    private void setTextOrDefault(View parent, int viewId, String value, String defaultValue) {
        ((TextView) parent.findViewById(viewId)).setText(isEmpty(value) ? defaultValue : value);
    }

    private boolean isEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvNumber, tvDate, tvCategory, tvType, tvContactName;
        ImageView ivCallType, ivSynced;

        ViewHolder(View itemView) {
            super(itemView);
            tvNumber = itemView.findViewById(R.id.tvNumber);
            tvContactName = itemView.findViewById(R.id.tvContactName);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvCategory = itemView.findViewById(R.id.tvCategory);
            tvType = itemView.findViewById(R.id.tvType);
            ivCallType = itemView.findViewById(R.id.ivCallType);
            ivSynced = itemView.findViewById(R.id.ivSynced);
        }
    }
}

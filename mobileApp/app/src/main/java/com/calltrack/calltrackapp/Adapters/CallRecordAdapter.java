package com.calltrack.calltrackapp.Adapters;

import android.app.AlertDialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;

import com.calltrack.calltrackapp.R;
import com.calltrack.calltrackapp.db.bundles.CallRecord;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

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
        holder.tvDate.setText(formatDate(record.date));
        holder.tvType.setText(record.type);
        holder.tvCategory.setText(isEmpty(record.category) ? "No category" : record.category);
        applyCallTypeStyle(context, holder.tvNumber, record.type);
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

    private void applyCallTypeStyle(Context context, TextView tvNumber, String type) {
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
            default:
                colorRes = R.color.black;
                iconRes = android.R.drawable.ic_menu_call;
                break;
        }
        tvNumber.setTextColor(ContextCompat.getColor(context, colorRes));
        tvNumber.setCompoundDrawablesWithIntrinsicBounds(iconRes, 0, 0, 0);
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
        if (isEmpty(record.notes)) {
            builder.setNeutralButton("Edit Notes", (dialog, which) -> showEditNotesDialog(context, record, position));
        }
        if (isEmpty(record.category)) {
            builder.setNegativeButton("Set Category", (dialog, which) -> showCategoryDialog(context, record, position));
        }
        builder.show();
    }

    private void showEditNotesDialog(Context context, CallRecord record, int position) {
        EditText input = new EditText(context);
        input.setHint("Enter notes");
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
        new AlertDialog.Builder(context)
            .setTitle("Select Category")
            .setItems(options, (d, idx) -> {
                record.category = options[idx];
                record.synced = false;
                listener.onRecordUpdated(record);
                notifyItemChanged(position);
            })
            .show();
    }

    private void setTextOrDefault(View parent, int viewId, String value, String defaultValue) {
        ((TextView) parent.findViewById(viewId)).setText(isEmpty(value) ? defaultValue : value);
    }

    private boolean isEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvNumber, tvDate, tvCategory, tvType;

        ViewHolder(View itemView) {
            super(itemView);
            tvNumber = itemView.findViewById(R.id.tvNumber);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvCategory = itemView.findViewById(R.id.tvCategory);
            tvType = itemView.findViewById(R.id.tvType);
        }
    }
}

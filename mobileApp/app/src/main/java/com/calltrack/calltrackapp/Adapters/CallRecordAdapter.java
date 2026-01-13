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
    private OnRecordUpdatedListener listener;

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
        View view = LayoutInflater.from(parent.getContext())
            .inflate(com.calltrack.calltrackapp.R.layout.item_call_record, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Context context = holder.itemView.getContext();
        CallRecord record = records.get(position);
        holder.tvNumber.setText(record.number);
        holder.tvDate.setText(formatDate(record.date));
        holder.tvType.setText(record.type);
        holder.tvCategory.setText(record.category.isEmpty() ? "No category" : record.category);
        holder.itemView.setOnClickListener(v -> showDetailsDialog(v.getContext(), record, position));
        TextView tvNumber = holder.tvNumber; // or findViewById(R.id.tvNumber)

        switch (record.type) {
            case "INCOMING":
                tvNumber.setTextColor(ContextCompat.getColor(context, R.color.call_incoming));
                tvNumber.setCompoundDrawablesWithIntrinsicBounds(android.R.drawable.sym_call_incoming, 0, 0, 0);
                break;
            case "OUTGOING":
                tvNumber.setTextColor(ContextCompat.getColor(context, R.color.call_outgoing));
                tvNumber.setCompoundDrawablesWithIntrinsicBounds(android.R.drawable.sym_call_outgoing, 0, 0, 0);
                break;
            case "MISSED":
                tvNumber.setTextColor(ContextCompat.getColor(context, R.color.call_missed));
                tvNumber.setCompoundDrawablesWithIntrinsicBounds(android.R.drawable.sym_call_missed, 0, 0, 0);
                break;
            default:
                tvNumber.setTextColor(ContextCompat.getColor(context, R.color.black));
                tvNumber.setCompoundDrawablesWithIntrinsicBounds(android.R.drawable.ic_menu_call, 0, 0, 0);
                break;
        }

    }


    @Override
    public int getItemCount() {
        return records.size();
    }

    private String formatDate(Long millis) {
        if (millis == null) return "";
        Date date = new Date(millis);
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
        return sdf.format(date);
    }

    public void updateData(List<CallRecord> newRecords) {
        this.records = newRecords;
        notifyDataSetChanged();
    }

    private void showDetailsDialog(Context context, CallRecord record, int position) {
        LayoutInflater inflater = LayoutInflater.from(context);
        View dialogView = inflater.inflate(R.layout.dialog_call_details, null);

        ((TextView) dialogView.findViewById(R.id.tvDetailNumber)).setText(record.number);
        ((TextView) dialogView.findViewById(R.id.tvDetailType)).setText(record.type);
        ((TextView) dialogView.findViewById(R.id.tvDetailDate)).setText(formatDate(record.date));
        ((TextView) dialogView.findViewById(R.id.tvDetailDuration)).setText(record.duration);
        ((TextView) dialogView.findViewById(R.id.tvDetailSimSlot)).setText(
            record.simSlot == null ? "-" : String.valueOf(record.simSlot));
        ((TextView) dialogView.findViewById(R.id.tvDetailCarrier)).setText(
            record.carrier == null ? "-" : record.carrier);
        ((TextView) dialogView.findViewById(R.id.tvDetailCategory)).setText(
            record.category == null || record.category.isEmpty() ? "Not set" : record.category);
        ((TextView) dialogView.findViewById(R.id.tvDetailNotes)).setText(
            record.notes == null || record.notes.isEmpty() ? "Not set" : record.notes);
        ((TextView) dialogView.findViewById(R.id.tvSynced)).setText(record.synced ? "Synced" : "Not synced");

        AlertDialog.Builder builder = new AlertDialog.Builder(context)
            .setTitle("Call Details")
            .setView(dialogView)
            .setPositiveButton("OK", null);

        // Add edit options as before
        if (record.notes == null || record.notes.isEmpty()) {
            builder.setNeutralButton("Edit Notes", (dialog, which) -> {
                EditText input = new EditText(context);
                input.setHint("Enter notes");
                new AlertDialog.Builder(context)
                    .setTitle("Add Notes")
                    .setView(input)
                    .setPositiveButton("Save", (d, w) -> {
                        record.notes = input.getText().toString();
                        record.synced = false;
                        listener.onRecordUpdated(record);
                        notifyDataSetChanged();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
            });
        }

        if (record.category == null || record.category.isEmpty()) {
            builder.setNegativeButton("Set Category", (dialog, which) -> {
                String[] options = {"BUSINESS", "PERSONAL", "IGNORED"};
                new AlertDialog.Builder(context)
                    .setTitle("Select Category")
                    .setItems(options, (d, idx) -> {
                        record.category = options[idx];
                        record.synced = false;
                        listener.onRecordUpdated(record);
                        notifyDataSetChanged();
                    })
                    .show();
            });
        }

        builder.show();
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

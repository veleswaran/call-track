package com.calltrack.calltrackapp.db.bundles;

import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(
    tableName = "call_records",
    indices = {
        @Index(value = {"callLocalId"}, unique = true)
    }
)
public class CallRecord {

    public CallRecord() {
        category = "";
        notes = "";
    }

    @PrimaryKey(autoGenerate = true)
    public Long id;

    public Long callLocalId;

    public Integer batteryLevel;
    public String number;
    public String type;
    public Long date;
    public String duration;
    public Integer simSlot;
    public String carrier;
    public String category;
    public String notes;
    public boolean synced;  // flag to track if sent to server
    public boolean noteSynced;
}

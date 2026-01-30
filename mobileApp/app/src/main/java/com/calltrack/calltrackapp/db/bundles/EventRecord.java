package com.calltrack.calltrackapp.db.bundles;

import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "event_records")
public class EventRecord {

    public EventRecord() {

    }

    @PrimaryKey(autoGenerate = true)
    public Long id;
    public String event_type;
    public String payload;
    public String occurred_at;
    public boolean synced;  // flag to track if sent to server

}

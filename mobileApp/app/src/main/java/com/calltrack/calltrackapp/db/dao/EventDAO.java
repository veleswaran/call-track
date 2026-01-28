package com.calltrack.calltrackapp.db.dao;

import com.calltrack.calltrackapp.db.bundles.EventRecord;

import java.util.List;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

@Dao
public interface EventDAO {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    void insert(EventRecord record);

    @Query("SELECT * FROM event_records WHERE synced = 0")
    List<EventRecord> getUnsyncedRecords();

    @Update
    void update(EventRecord record);
}

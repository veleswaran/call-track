package com.calltrack.calltrackapp.db.dao;

import com.calltrack.calltrackapp.db.bundles.CallRecord;

import java.util.List;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

@Dao
public interface CallRecordDAO {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    void insert(CallRecord record);

    @Query("SELECT * FROM call_records WHERE synced = 0")
    List<CallRecord> getUnsyncedRecords();

    @Query("SELECT * FROM call_records ORDER BY date DESC")
    LiveData<List<CallRecord>> getAll();

    @Update
    void update(CallRecord record);

    @Update
    void updateAll(List<CallRecord> records);

    @Query("DELETE FROM call_records")
    void deleteAll();

    @Query("DELETE FROM call_records WHERE synced = 1 AND date < :twoWeeksAgo")
    void deleteSynced(long twoWeeksAgo);
}

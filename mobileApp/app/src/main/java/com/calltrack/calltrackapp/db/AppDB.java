package com.calltrack.calltrackapp.db;

import android.content.Context;

import com.calltrack.calltrackapp.constants.DBConst;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.db.dao.CallRecordDAO;
import com.calltrack.calltrackapp.db.dao.TokenDAO;
import com.calltrack.calltrackapp.db.utilities.Converters;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;

@Database(entities = {CallRecord.class, TokenEntity.class}, version = 1, exportSchema = false)
@TypeConverters({Converters.class})
public abstract class AppDB extends RoomDatabase {
    public abstract CallRecordDAO callRecordDao();

    public abstract TokenDAO tokenDao();

    private static volatile AppDB INSTANCE;

    public static AppDB getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDB.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(), AppDB.class, DBConst.DB_NAME).build();
                }
            }
        }
        return INSTANCE;
    }
}

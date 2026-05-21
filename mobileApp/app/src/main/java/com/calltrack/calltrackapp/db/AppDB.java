package com.calltrack.calltrackapp.db;

import android.content.Context;

import com.calltrack.calltrackapp.constants.DBConst;
import com.calltrack.calltrackapp.db.bundles.CallRecord;
import com.calltrack.calltrackapp.db.bundles.EventRecord;
import com.calltrack.calltrackapp.db.bundles.PhoneNumberCategory;
import com.calltrack.calltrackapp.db.bundles.TokenEntity;
import com.calltrack.calltrackapp.db.dao.CallRecordDAO;
import com.calltrack.calltrackapp.db.dao.EventDAO;
import com.calltrack.calltrackapp.db.dao.PhoneNumberCategoryDAO;
import com.calltrack.calltrackapp.db.dao.TokenDAO;
import com.calltrack.calltrackapp.db.utilities.Converters;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

@Database(entities = {CallRecord.class, TokenEntity.class, EventRecord.class, PhoneNumberCategory.class}, version = 2, exportSchema = false)
@TypeConverters({Converters.class})
public abstract class AppDB extends RoomDatabase {
    public abstract CallRecordDAO callRecordDao();

    public abstract TokenDAO tokenDao();

    public abstract EventDAO eventDAO();

    public abstract PhoneNumberCategoryDAO phoneNumberCategoryDao();

    private static volatile AppDB INSTANCE;

    /**
     * Migration from version 1 to 2: Add phone_number_categories table
     */
    static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(SupportSQLiteDatabase database) {
            // Create the phone_number_categories table
            database.execSQL(
                "CREATE TABLE IF NOT EXISTS `phone_number_categories` (" +
                "`id` INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "`phoneNumber` TEXT NOT NULL, " +
                "`normalizedNumber` TEXT NOT NULL, " +
                "`category` TEXT NOT NULL, " +
                "`lastUpdated` INTEGER)"
            );

            // Create unique index on normalizedNumber for fast lookups
            database.execSQL(
                "CREATE UNIQUE INDEX IF NOT EXISTS `index_phone_number_categories_normalizedNumber` " +
                "ON `phone_number_categories` (`normalizedNumber`)"
            );
        }
    };

    public static AppDB getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDB.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(), AppDB.class, DBConst.DB_NAME)
                        .addMigrations(MIGRATION_1_2)
                        .build();
                }
            }
        }
        return INSTANCE;
    }
}

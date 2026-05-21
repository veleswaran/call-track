package com.calltrack.calltrackapp.db.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.calltrack.calltrackapp.db.bundles.PhoneNumberCategory;

/**
 * DAO for managing phone number category preferences.
 */
@Dao
public interface PhoneNumberCategoryDAO {

    /**
     * Insert or replace a phone number category preference
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(PhoneNumberCategory preference);

    /**
     * Update an existing preference
     */
    @Update
    void update(PhoneNumberCategory preference);

    /**
     * Get category preference for a normalized phone number
     *
     * @param normalizedNumber The normalized phone number (last 10 digits)
     * @return PhoneNumberCategory if found, null otherwise
     */
    @Query("SELECT * FROM phone_number_categories WHERE normalizedNumber = :normalizedNumber LIMIT 1")
    PhoneNumberCategory getCategoryForNumber(String normalizedNumber);

    /**
     * Check if we have a category preference for a number
     *
     * @param normalizedNumber The normalized phone number
     * @return true if preference exists
     */
    @Query("SELECT COUNT(*) > 0 FROM phone_number_categories WHERE normalizedNumber = :normalizedNumber")
    boolean hasPreferenceForNumber(String normalizedNumber);

    /**
     * Delete all category preferences (for testing or reset)
     */
    @Query("DELETE FROM phone_number_categories")
    void deleteAll();

    /**
     * Delete preferences older than a certain timestamp (optional cleanup)
     *
     * @param timestamp Unix timestamp in milliseconds
     */
    @Query("DELETE FROM phone_number_categories WHERE lastUpdated < :timestamp")
    void deleteOlderThan(long timestamp);

    /**
     * Get count of stored preferences (for stats/debugging)
     */
    @Query("SELECT COUNT(*) FROM phone_number_categories")
    int getPreferenceCount();
}

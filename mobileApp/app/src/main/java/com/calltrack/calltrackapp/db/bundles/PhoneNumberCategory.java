package com.calltrack.calltrackapp.db.bundles;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

/**
 * Entity to store category preferences for phone numbers.
 * When a user sets a category for a phone number, we remember it
 * and automatically apply it to future calls from that number.
 */
@Entity(
    tableName = "phone_number_categories",
    indices = {
        @Index(value = {"normalizedNumber"}, unique = true)
    }
)
public class PhoneNumberCategory {

    @PrimaryKey(autoGenerate = true)
    public Long id;

    /**
     * Original phone number as it appears
     */
    @NonNull
    public String phoneNumber;

    /**
     * Normalized version (digits only, last 10 digits for matching)
     * Used for fuzzy matching regardless of formatting or country codes
     */
    @NonNull
    public String normalizedNumber;

    /**
     * Preferred category: "BUSINESS", "PERSONAL", or "IGNORED"
     */
    @NonNull
    public String category;

    /**
     * Timestamp of last update (for future analytics or cleanup)
     */
    public Long lastUpdated;

    public PhoneNumberCategory() {
        this.lastUpdated = System.currentTimeMillis();
    }

    /**
     * Normalize a phone number to digits only, keeping last 10 digits for comparison.
     * This handles cases like:
     * - "+1 234 567 8900" → "2345678900"
     * - "(234) 567-8900" → "2345678900"
     * - "2345678900" → "2345678900"
     *
     * @param number The phone number to normalize
     * @return Normalized number (last 10 digits)
     */
    public static String normalizePhoneNumber(String number) {
        if (number == null || number.isEmpty()) {
            return "";
        }

        // Remove all non-digit characters
        String digitsOnly = number.replaceAll("[^0-9]", "");

        // Keep last 10 digits (or less if shorter)
        // This handles country codes and ensures consistent matching
        if (digitsOnly.length() > 10) {
            return digitsOnly.substring(digitsOnly.length() - 10);
        }

        return digitsOnly;
    }
}

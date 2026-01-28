<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Stateless utility for phone number normalization.
 * Ensures consistent hashing across the application.
 */
class PhoneNormalizer
{
    /**
     * Normalize phone number to digits only.
     */
    public static function normalize(string $phone, string $defaultCountryCode = '+91'): string
    {
        $phone = preg_replace('/[\s\-\(\)\.]/', '', $phone);

        // Convert 00 prefix to +
        if (str_starts_with($phone, '00')) {
            $phone = '+'.substr($phone, 2);
        }

        // If already in international format like +441234567890
        if (preg_match('/^\+\d{8,15}$/', $phone)) {
            return $phone;
        }

        // If starts with country code but missing +
        $countryDigits = ltrim($defaultCountryCode, '+');
        if (preg_match('/^'.$countryDigits.'\d{6,12}$/', $phone)) {
            return '+'.$phone;
        }

        // Plain 10-digit Indian number
        if (preg_match('/^\d{10}$/', $phone)) {
            return $defaultCountryCode.$phone;
        }

        $digits = preg_replace('/\D/', '', $phone);

        return '+'.$digits;
    }

    /**
     * Generate search variations for a phone number.
     * Returns array of normalized phone numbers to try.
     *
     * @return array<string>
     */
    public static function generateSearchVariations(string $search): array
    {
        $variations = [];

        // 1. Original search term (as-is)
        $variations[] = $search;

        // 2. Digits only
        $digitsOnly = self::normalize($search);
        if ($digitsOnly !== $search) {
            $variations[] = $digitsOnly;
        }

        // 3. With +91 prefix (if not already present)
        if (! str_starts_with($search, '+91') && ! str_starts_with($search, '91')) {
            $variations[] = '+91'.$digitsOnly;
            $variations[] = '91'.$digitsOnly;
        }

        // 4. Without +91 prefix (if present)
        if (str_starts_with($search, '+91')) {
            $without91 = substr($digitsOnly, 2); // Remove '91' from digits
            if (strlen($without91) === 10) { // Valid Indian mobile number
                $variations[] = $without91;
            }
        } elseif (str_starts_with($search, '91') && strlen($digitsOnly) === 12) {
            $without91 = substr($digitsOnly, 2);
            $variations[] = $without91;
        }

        // Remove duplicates
        return array_unique($variations);
    }

    /**
     * Generate hash variations for phone number search.
     *
     * @return array<string>
     */
    public static function generateHashVariations(string $search): array
    {
        $variations = self::generateSearchVariations($search);

        return array_map(fn (string $variation) => hash('sha256', $variation), $variations);
    }
}

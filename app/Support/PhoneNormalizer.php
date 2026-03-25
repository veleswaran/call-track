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

    public static function generateSearchVariations(string $search): array
    {
        $variations = [];
        
        // Remove all non-digit characters except +
        $clean = preg_replace('/[^\d+]/', '', $search);
        
        // 1. As-is (cleaned)
        $variations[] = $clean;
        
        // 2. Digits only (no +)
        $digits = preg_replace('/\D/', '', $clean);
        $variations[] = $digits;
        
        // 3. Fully normalized
        $normalized = self::normalize($clean);
        $variations[] = $normalized;
        $variations[] = ltrim($normalized, '+'); // Normalized without +

        // 4. Handle Country Code (+91)
        if (str_starts_with($normalized, '+91')) {
            $without91 = substr($normalized, 3); // Remove +91
            if (strlen($without91) >= 10) {
                $variations[] = $without91;
                $variations[] = '0'.$without91; // Common local format
            }
        } elseif (strlen($digits) === 10) {
            // Local 10-digit number
            $variations[] = '+91'.$digits;
            $variations[] = '91'.$digits;
            $variations[] = '0'.$digits;
        }

        // Remove duplicates and empty strings
        return array_values(array_unique(array_filter($variations)));
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

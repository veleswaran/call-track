<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Support\PhoneNormalizer;
use Illuminate\Support\Facades\Cache;

class GetContactHashVariationsAction
{
    /**
     * Get all unique hash variations for existing contacts.
     * Uses cache for performance (expires when contacts change).
     *
     * @return array<string>
     */
    public function execute(): array
    {
        return Cache::remember('contact_hash_variations', 3600, function () {
            $allHashes = [];

            // Use cursor to iterate and ensure phone_number is decrypted via model casting
            foreach (Contact::whereNotNull('phone_number')->cursor() as $contact) {
                $variations = PhoneNormalizer::generateHashVariations($contact->phone_number);
                foreach ($variations as $hash) {
                    $allHashes[] = $hash;
                }
            }

            // Also include existing phone_hash as a fallback for old contacts without phone_number
            $existingHashes = Contact::pluck('phone_hash')->all();
            foreach ($existingHashes as $hash) {
                $allHashes[] = $hash;
            }

            return array_values(array_unique($allHashes));
        });
    }

    /**
     * Clear the cache for contact variations.
     * Should be called when contacts are added/updated/deleted.
     */
    public function clearCache(): void
    {
        Cache::forget('contact_hash_variations');
    }
}

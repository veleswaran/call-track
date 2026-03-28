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

            // A single loop over internal contacts is more efficient.
            foreach (Contact::where('is_internal', true)->cursor() as $contact) {
                // Generate variations if a phone number is present.
                if ($contact->phone_number) {
                    $variations = PhoneNormalizer::generateHashVariations($contact->phone_number);
                    foreach ($variations as $hash) {
                        $allHashes[] = $hash;
                    }
                }

                // Always include the existing phone_hash as a primary/fallback identifier.
                if ($contact->phone_hash) {
                    $allHashes[] = $contact->phone_hash;
                }
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

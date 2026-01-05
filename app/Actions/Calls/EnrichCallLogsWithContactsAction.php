<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\Contact;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Batch-enriches a page of call logs with their related contact (by phone_hash) to avoid N+1 queries.
 */
final class EnrichCallLogsWithContactsAction
{
    /**
     * Enrich a paginator's current page collection in-place and return it for chaining.
     */
    public function execute(LengthAwarePaginator $paginator): LengthAwarePaginator
    {
        /** @var Collection<int, \App\Domain\Calls\Models\CallLog> $collection */
        $collection = $paginator->getCollection();

        if ($collection->isEmpty()) {
            return $paginator;
        }

        $hashes = [];
        foreach ($collection as $log) {
            $phone = (string) $log->phone_number; // decrypted via cast
            $normalizedPhone = \App\Support\PhoneNormalizer::normalize($phone);
            $hashes[] = hash('sha256', $normalizedPhone);
        }

        if ($hashes === []) {
            return $paginator;
        }

        $unique = array_values(array_unique($hashes));

        // Lightweight cache of the contact map keyed by the current page hash set.
        $cacheKey = 'contacts_map_by_hash:'.md5(implode('|', $unique));
        $ttl = (int) (config('cache.ttl_contacts_map', 60)); // default 60s

        $map = Cache::remember($cacheKey, $ttl, function () use ($unique) {
            return Contact::query()
                ->whereIn('phone_hash', $unique)
                ->get()
                ->keyBy('phone_hash');
        });

        foreach ($collection as $log) {
            $phone = (string) $log->phone_number;
            $normalizedPhone = \App\Support\PhoneNormalizer::normalize($phone);
            $hash = hash('sha256', $normalizedPhone);
            $log->setRelation('contact_by_hash', $map->get($hash));
        }

        return $paginator;
    }
}

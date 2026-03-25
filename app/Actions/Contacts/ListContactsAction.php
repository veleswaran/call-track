<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\ListContactsDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ListContactsAction
{
    public function execute(ListContactsDTO $dto): LengthAwarePaginator
    {
        return Contact::query()
            ->when($dto->search, function (Builder $query, string $search) {
                $term = strtolower($search);
                $normalizedSearch = \App\Support\PhoneNormalizer::normalize($search);
                $searchHash = ! empty($normalizedSearch) ? hash('sha256', $normalizedSearch) : null;

                $query->where(function ($q) use ($term, $searchHash) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);

                    if ($searchHash) {
                        $q->orWhere('phone_hash', $searchHash);
                    }
                });
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}

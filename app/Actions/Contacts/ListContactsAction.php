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
                $query->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(phone_number) LIKE ?', ["%{$term}%"]);
                });
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}

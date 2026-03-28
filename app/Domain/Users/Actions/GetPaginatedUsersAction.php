<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Users\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class GetPaginatedUsersAction
{
    public function execute(\App\Domain\Users\DTOs\ListUsersDTO $dto): LengthAwarePaginator
    {
        return User::query()
            ->with(['agent']) // Eager load agent to avoid N+1
            ->when($dto->search, function ($query, $search) {
                $term = strtolower((string) $search);
                $query->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(email) LIKE ?', ["%{$term}%"]);
                });
            })
            ->latest()
            ->paginate($dto->perPage);
    }
}

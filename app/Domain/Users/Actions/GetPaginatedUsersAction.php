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
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($dto->perPage);
    }
}

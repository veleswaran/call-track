<?php

declare(strict_types=1);

namespace App\Services;

use App\Actions\Calls\BuildCallLogQueryAction;
use App\Actions\Calls\EnrichCallLogsWithContactsAction;
use App\Contracts\Services\CallLogQueryServiceContract;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Service that orchestrates building, paginating, and enriching Admin call log listings.
 */
final class CallLogQueryService implements CallLogQueryServiceContract
{
    public function __construct(
        private readonly BuildCallLogQueryAction $buildQuery,
        private readonly EnrichCallLogsWithContactsAction $enrichWithContacts,
    ) {}

    public function list(ListCallLogsDTO $dto): LengthAwarePaginator
    {
        $query = $this->buildQuery->execute($dto);

        $paginator = $query->paginate($dto->perPage, page: $dto->page);

        return $this->enrichWithContacts->execute($paginator);
    }
}

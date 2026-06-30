<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Contacts\DTOs\ImportContactsResultDTO;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ImportContactsResultDTO
 */
final class ImportContactsResultResource extends JsonResource
{
    public static $wrap = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ImportContactsResultDTO $result */
        $result = $this->resource;

        return [
            'total_rows' => $result->totalRows,
            'created' => $result->created,
            'updated' => $result->updated,
            'failed' => $result->failed,
            'errors' => $result->errors,
        ];
    }
}

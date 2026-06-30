<?php

declare(strict_types=1);

namespace App\Domain\Contacts\DTOs;

use App\Http\Requests\ImportContactsRequest;
use Illuminate\Http\UploadedFile;

readonly class ImportContactsDTO
{
    public function __construct(
        public string $filePath,
    ) {}

    public static function fromRequest(ImportContactsRequest $request): self
    {
        /** @var UploadedFile $file */
        $file = $request->file('file');

        return new self(
            filePath: $file->getRealPath(),
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\ImportContactsDTO;
use App\Domain\Contacts\DTOs\ImportContactsResultDTO;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use App\Support\PhoneNormalizer;
use Illuminate\Validation\ValidationException;

/**
 * Parses a CSV file and upserts contacts by normalized phone hash.
 */
class ImportContactsAction
{
    public const MAX_IMPORT_ROWS = 5_000;

    public function __construct(
        private readonly CreateOrUpdateContactAction $createOrUpdateContactAction,
        private readonly GetContactHashVariationsAction $getContactHashVariationsAction,
    ) {}

    public function execute(ImportContactsDTO $dto): ImportContactsResultDTO
    {
        $handle = fopen($dto->filePath, 'r');

        if ($handle === false) {
            throw ValidationException::withMessages([
                'file' => ['Unable to read import file.'],
            ]);
        }

        try {
            return $this->processFile($handle);
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  resource  $handle
     */
    private function processFile($handle): ImportContactsResultDTO
    {
        $header = fgetcsv($handle);

        if ($header === false) {
            throw ValidationException::withMessages([
                'file' => ['Import file is empty.'],
            ]);
        }

        $columnMap = $this->mapColumns($this->normalizeHeader($header));

        if (! isset($columnMap['name'], $columnMap['phone_number'])) {
            throw ValidationException::withMessages([
                'file' => ['CSV must include name and phone_number columns.'],
            ]);
        }

        $existingHashes = array_fill_keys(
            Contact::query()->pluck('phone_hash')->all(),
            true,
        );

        $totalRows = 0;
        $created = 0;
        $updated = 0;
        $failed = 0;
        $errors = [];
        $rowNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            if ($this->isEmptyRow($row)) {
                continue;
            }

            $totalRows++;

            if ($totalRows > self::MAX_IMPORT_ROWS) {
                throw ValidationException::withMessages([
                    'file' => [
                        'Import exceeds the maximum of '.number_format(self::MAX_IMPORT_ROWS).' rows.',
                    ],
                ]);
            }

            $name = trim((string) ($row[$columnMap['name']] ?? ''));
            $phoneNumber = trim((string) ($row[$columnMap['phone_number']] ?? ''));
            $isInternalRaw = isset($columnMap['is_internal'])
                ? trim((string) ($row[$columnMap['is_internal']] ?? ''))
                : '';

            $validationError = $this->validateRow($name, $phoneNumber);

            if ($validationError !== null) {
                $failed++;
                $errors[] = [
                    'row' => $rowNumber,
                    'message' => $validationError,
                ];

                continue;
            }

            $normalizedPhone = PhoneNormalizer::normalize($phoneNumber);
            $phoneHash = hash('sha256', $normalizedPhone);
            $isUpdate = isset($existingHashes[$phoneHash]);

            $this->createOrUpdateContactAction->execute(
                new StoreContactDTO(
                    name: $name,
                    phoneNumber: $normalizedPhone,
                    isInternal: $this->parseBoolean($isInternalRaw),
                ),
                clearContactCache: false,
            );

            if ($isUpdate) {
                $updated++;
            } else {
                $created++;
                $existingHashes[$phoneHash] = true;
            }
        }

        $this->getContactHashVariationsAction->clearCache();

        return new ImportContactsResultDTO(
            totalRows: $totalRows,
            created: $created,
            updated: $updated,
            failed: $failed,
            errors: $errors,
        );
    }

    /**
     * @param  array<int, string|null>  $header
     * @return array<int, string>
     */
    private function normalizeHeader(array $header): array
    {
        return array_map(function (?string $column): string {
            $column = trim((string) $column);

            if (str_starts_with($column, "\xEF\xBB\xBF")) {
                $column = substr($column, 3);
            }

            return strtolower($column);
        }, $header);
    }

    /**
     * @param  array<int, string>  $header
     * @return array<string, int>
     */
    private function mapColumns(array $header): array
    {
        $aliases = [
            'name' => ['name', 'contact_name', 'contact name', 'full name'],
            'phone_number' => ['phone_number', 'phone number', 'phone', 'mobile', 'mobile number'],
            'is_internal' => ['is_internal', 'is internal', 'internal'],
        ];

        $columnMap = [];

        foreach ($aliases as $field => $names) {
            foreach ($names as $name) {
                $index = array_search($name, $header, true);

                if ($index !== false) {
                    $columnMap[$field] = $index;
                    break;
                }
            }
        }

        return $columnMap;
    }

    /**
     * @param  array<int, string|null>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function validateRow(string $name, string $phoneNumber): ?string
    {
        if ($name === '') {
            return 'Name is required.';
        }

        if (mb_strlen($name) > 255) {
            return 'Name must not exceed 255 characters.';
        }

        if ($phoneNumber === '') {
            return 'Phone number is required.';
        }

        if (mb_strlen($phoneNumber) > 20) {
            return 'Phone number must not exceed 20 characters.';
        }

        return null;
    }

    private function parseBoolean(string $value): bool
    {
        if ($value === '') {
            return false;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'y'], true);
    }
}

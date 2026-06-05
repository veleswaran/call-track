<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams call logs as CSV using chunked queries to keep memory bounded.
 */
final class ExportCallLogsAction
{
    public const MAX_EXPORT_ROWS = 150_000;

    private const CHUNK_SIZE = 500;

    public function __construct(
        private readonly BuildCallLogQueryAction $buildQuery,
        private readonly EnrichCallLogsWithContactsAction $enrichWithContacts,
    ) {}

    public function execute(ListCallLogsDTO $dto): StreamedResponse
    {
        $query = $this->buildQuery->execute($dto);

        $count = (clone $query)->count();

        if ($count > self::MAX_EXPORT_ROWS) {
            throw ValidationException::withMessages([
                'export' => [
                    'Too many rows ('.number_format($count).'). Narrow your filters to export fewer than '
                    .number_format(self::MAX_EXPORT_ROWS).' call logs.',
                ],
            ]);
        }

        $filename = sprintf(
            'call-logs-%s-to-%s.csv',
            $dto->dateFrom,
            $dto->dateTo,
        );

        return response()->streamDownload(
            function () use ($query): void {
                $handle = fopen('php://output', 'w');

                if ($handle === false) {
                    return;
                }

                fputcsv($handle, $this->headers());

                $query
                    ->reorder('call_logs.id')
                    ->with(['classification', 'device', 'agent'])
                    ->chunkById(self::CHUNK_SIZE, function (EloquentCollection $logs) use ($handle): void {
                        // @phpstan-ignore argument.type (chunkById yields Collection<int, Model> on a CallLog query)
                        $enriched = $this->enrichWithContacts->enrichCollection($logs);

                        foreach ($enriched as $log) {
                            /** @var CallLog $log */
                            fputcsv($handle, $this->formatRow($log));
                        }
                    }, column: 'call_logs.id', alias: 'id');

                fclose($handle);
            },
            $filename,
            ['Content-Type' => 'text/csv; charset=UTF-8'],
        );
    }

    /**
     * @return string[]
     */
    private function headers(): array
    {
        return [
            'Timestamp',
            'Phone Number',
            'Phone Contact Name',
            'Contact Name',
            'Device',
            'SIM Slot',
            'Agent',
            'Duration (seconds)',
            'Call Type',
            'Call Outcome',
            'Classification',
            'Classification Note',
            'Contact Notes',
            'Internal Contact',
        ];
    }

    /**
     * @return array<int, string|int|null>
     */
    private function formatRow(CallLog $log): array
    {
        /** @var \App\Domain\Devices\Models\Device|null $device */
        $device = $log->getRelationValue('device');

        /** @var \App\Domain\Agents\Models\Agent|null $agent */
        $agent = $log->getRelationValue('agent');

        $contact = $log->getRelationValue('contact_by_hash');

        $classification = $log->classification;

        return [
            $this->sanitizeCsvValue($log->timestamp->format('Y-m-d H:i:s')),
            (string) $log->phone_number,
            $this->sanitizeCsvValue($log->phone_contact_name),
            $this->sanitizeCsvValue($contact?->name),
            $this->sanitizeCsvValue($device?->name),
            $this->formatSimSlot($log),
            $this->sanitizeCsvValue($agent?->name),
            $log->duration,
            $this->sanitizeCsvValue(strtolower($log->direction)),
            $this->sanitizeCsvValue($log->call_outcome ?? ''),
            $this->sanitizeCsvValue($classification ? strtolower($classification->type) : 'unclassified'),
            $this->sanitizeCsvValue($classification?->note),
            $this->sanitizeCsvValue($contact?->notes),
            $contact?->is_internal ? 'Yes' : 'No',
        ];
    }

    private function formatSimSlot(CallLog $log): string
    {
        $attributes = $log->getAttributes();

        if (! array_key_exists('sim_slot', $attributes) || $attributes['sim_slot'] === null) {
            return '';
        }

        return 'SIM '.(((int) $attributes['sim_slot']) + 1);
    }

    private function sanitizeCsvValue(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        if (preg_match('/^[=+\-@\t\r]/', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}

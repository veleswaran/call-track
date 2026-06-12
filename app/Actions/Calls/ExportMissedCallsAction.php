<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Domain\Calls\Models\CallEscalation;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams missed call escalations as CSV using chunked queries to keep memory bounded.
 */
final class ExportMissedCallsAction
{
    public const MAX_EXPORT_ROWS = 150_000;

    private const CHUNK_SIZE = 500;

    public function __construct(
        private readonly GetEscalationInsightsAction $getEscalationInsightsAction,
    ) {}

    public function execute(EscalationFilterDTO $dto): StreamedResponse
    {
        $query = CallEscalation::query();
        $query = $this->getEscalationInsightsAction->applyFilters($query, $dto);
        $query->orderBy('response_due_at', 'desc');

        $count = (clone $query)->count();

        if ($count > self::MAX_EXPORT_ROWS) {
            throw ValidationException::withMessages([
                'export' => [
                    'Too many rows ('.number_format($count).'). Narrow your filters to export fewer than '
                    .number_format(self::MAX_EXPORT_ROWS).' missed calls.',
                ],
            ]);
        }

        $filename = sprintf(
            'missed-calls-%s-to-%s.csv',
            $dto->date_from,
            $dto->date_to,
        );

        return response()->streamDownload(
            function () use ($query): void {
                $handle = fopen('php://output', 'w');

                if ($handle === false) {
                    return;
                }

                fputcsv($handle, $this->headers());

                $query
                    ->reorder('call_escalations.id')
                    ->with(['callLog', 'callLog.agent', 'callLog.device', 'resolvedByCall'])
                    ->chunkById(self::CHUNK_SIZE, function (EloquentCollection $escalations) use ($handle): void {
                        foreach ($escalations as $escalation) {
                            /** @var CallEscalation $escalation */
                            fputcsv($handle, $this->formatRow($escalation));
                        }
                    }, column: 'call_escalations.id', alias: 'id');

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
            'Agent',
            'Client Number',
            'Phone Contact Name',
            'Call Time',
            'Status',
            'SLA Deadline',
            'Follow-up Time',
        ];
    }

    /**
     * @return array<int, string|null>
     */
    private function formatRow(CallEscalation $escalation): array
    {
        $callLog = $escalation->callLog;

        return [
            $this->sanitizeCsvValue($callLog?->agent->name ?? 'Unknown Agent'),
            (string) ($callLog->phone_number ?? ''),
            $this->sanitizeCsvValue($callLog?->phone_contact_name),
            $callLog?->timestamp?->format('Y-m-d H:i:s') ?? '',
            $this->sanitizeCsvValue($escalation->status),
            $escalation->response_due_at->format('Y-m-d H:i:s'),
            $escalation->resolved_at?->format('Y-m-d H:i:s') ?? '',
        ];
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

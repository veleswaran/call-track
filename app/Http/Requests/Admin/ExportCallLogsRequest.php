<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates query parameters for exporting call logs as CSV.
 */
class ExportCallLogsRequest extends FormRequest
{
    public const MAX_EXPORT_DAYS = 31;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'device_id' => ['sometimes', 'integer', 'min:1'],

            'agent_id' => ['sometimes', 'integer', 'min:1'],
            'agents' => ['sometimes', 'array'],
            'agents.*' => ['integer', 'min:1'],

            'team_id' => ['sometimes', 'integer', 'min:1'],
            'team_ids' => ['sometimes', 'array'],
            'team_ids.*' => ['integer', 'min:1'],

            'sim_slot' => ['sometimes', 'integer', 'min:0'],

            'classification' => ['sometimes', 'string', 'in:business,personal,ignored'],
            'classifications' => ['sometimes', 'array'],
            'classifications.*' => ['string', 'in:business,personal,ignored'],

            'call_type' => ['sometimes', 'string', 'in:incoming,outgoing,missed,rejected,blocked,unknown'],
            'types' => ['sometimes', 'array'],
            'types.*' => ['string', 'in:incoming,outgoing,missed,rejected,blocked,unknown'],

            'outcomes' => ['sometimes', 'array'],
            'outcomes.*' => ['string', 'in:Connected,Missed,No Answer'],

            'start_date' => ['required_without:date_from', 'date'],
            'end_date' => ['required_without:date_to', 'date'],
            'date_from' => ['required_without:start_date', 'date'],
            'date_to' => ['required_without:end_date', 'date'],

            'search' => ['sometimes', 'string', 'max:255'],
            'contact_filter' => ['sometimes', 'string', 'in:all,internal,external'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $startDate = $this->input('start_date') ?? $this->input('date_from');
            $endDate = $this->input('end_date') ?? $this->input('date_to');

            if (! $startDate || ! $endDate) {
                return;
            }

            if (Carbon::parse($endDate)->lt(Carbon::parse($startDate))) {
                $validator->errors()->add('end_date', 'The end date must be after or equal to the start date.');

                return;
            }

            if ($this->diffInCalendarDays($startDate, $endDate) >= self::MAX_EXPORT_DAYS) {
                $validator->errors()->add(
                    'date_range',
                    'Date range cannot exceed '.self::MAX_EXPORT_DAYS.' days for export.'
                );
            }
        });
    }

    /**
     * Calendar days between two dates, matching date-fns differenceInCalendarDays(later, earlier).
     */
    private function diffInCalendarDays(string $startDate, string $endDate): int
    {
        $start = Carbon::createFromFormat('Y-m-d', Carbon::parse($startDate)->toDateString(), 'UTC');
        $end = Carbon::createFromFormat('Y-m-d', Carbon::parse($endDate)->toDateString(), 'UTC');

        return (int) $start->diffInDays($end);
    }
}

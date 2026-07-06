<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validates query parameters for exporting missed call escalations as CSV.
 */
class ExportMissedCallsRequest extends FormRequest
{
    public const MAX_EXPORT_DAYS = 32;

    public function authorize(): bool
    {
        return $this->user()->can('view escalations');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
            'team_ids' => ['nullable', 'array'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'status' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    $allowed = ['pending', 'unattended', 'resolved'];
                    $statuses = is_array($value) ? $value : explode(',', (string) $value);
                    foreach ($statuses as $status) {
                        if (! in_array(trim($status), $allowed)) {
                            $fail(__('validation.in', ['attribute' => $attribute]));
                        }
                    }
                },
            ],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date'],
            'contact_filter' => ['nullable', 'string', 'in:all,internal,external'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'in:BUSINESS,PERSONAL,IGNORED'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->hasAny(['date_from', 'date_to'])) {
                return;
            }

            $startDate = $this->input('date_from');
            $endDate = $this->input('date_to');

            if (! is_string($startDate) || ! is_string($endDate)) {
                return;
            }

            if ($startDate === '' || $endDate === '') {
                return;
            }

            try {
                $parsedStart = Carbon::parse($startDate)->utc()->startOfDay();
                $parsedEnd = Carbon::parse($endDate)->utc()->startOfDay();
            } catch (\Throwable) {
                return;
            }

            if ($parsedEnd->lt($parsedStart)) {
                $validator->errors()->add('date_to', 'The end date must be after or equal to the start date.');

                return;
            }

            if ((int) $parsedStart->diffInDays($parsedEnd) >= self::MAX_EXPORT_DAYS) {
                $validator->errors()->add(
                    'date_range',
                    'Date range cannot exceed '.self::MAX_EXPORT_DAYS.' days for export.'
                );
            }
        });
    }
}

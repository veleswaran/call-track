<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates query parameters for listing call logs in the Admin API.
 */
class IndexCallLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Sanctum middleware already guards this route; allow here.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'device_id' => ['sometimes', 'integer', 'min:1'],

            // Filters
            'agent_id' => ['sometimes', 'integer', 'min:1'],
            'agents' => ['sometimes', 'array'],
            'agents.*' => ['integer', 'min:1'],

            'sim_slot' => ['sometimes', 'integer', 'min:0'],

            'classification' => ['sometimes', 'string', 'in:business,personal,ignored'],
            'classifications' => ['sometimes', 'array'],
            'classifications.*' => ['string', 'in:business,personal,ignored'],

            'call_type' => ['sometimes', 'string', 'in:incoming,outgoing,missed,rejected,blocked,unknown'],
            'types' => ['sometimes', 'array'],
            'types.*' => ['string', 'in:incoming,outgoing,missed,rejected,blocked,unknown'],

            'statuses' => ['sometimes', 'array'],
            'statuses.*' => ['string', 'in:Connected,Missed,No Answer'],

            // Dates (support both old and new keys)
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date', 'after_or_equal:date_from'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],

            'search' => ['sometimes', 'string', 'max:255'],
        ];
    }
}

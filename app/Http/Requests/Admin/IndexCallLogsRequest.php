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
            'agent_id' => ['sometimes', 'integer', 'min:1'],
            'classification' => ['sometimes', 'string', 'in:business,personal,ignored'],
            'call_type' => ['sometimes', 'string', 'in:incoming,outgoing,missed'],
            'date_from' => ['sometimes', 'date'],
            'date_to' => ['sometimes', 'date', 'after_or_equal:date_from'],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class GetReportDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Admin middleware handles auth
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'agent_ids' => ['nullable', 'array'],
            'agent_ids.*' => ['integer', 'exists:users,id'], // Assuming agents are users
            'outcomes' => ['nullable', 'array'],
            'outcomes.*' => ['string', 'in:MISSED,NO_ANSWER,CONNECTED'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'in:BUSINESS,PERSONAL,IGNORED'], // Based on ReportFilterDTO logic
            'search' => ['nullable', 'string', 'max:255'],
        ];
    }
}

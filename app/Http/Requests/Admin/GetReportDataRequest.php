<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class GetReportDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->boolean('for_export')) {
            return true;
        }

        return $this->user()?->hasRole('super-admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'agent_ids' => ['nullable', 'array'],
            'agent_ids.*' => ['integer', 'exists:agents,id'], // Agents are from the 'agents' table
            'team_ids' => ['nullable', 'array'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => ['string', 'in:MISSED,NO_ANSWER,CONNECTED'],
            'outcomes' => ['nullable', 'array'],
            'outcomes.*' => ['string', 'in:Connected,Missed,No Answer'],
            'types' => ['nullable', 'array'],
            'types.*' => ['string', 'in:BUSINESS,PERSONAL,IGNORED'], // Based on ReportFilterDTO logic
            'search' => ['nullable', 'string', 'max:255'],
            'contact_filter' => ['nullable', 'string', 'in:all,internal,external'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort_by' => ['nullable', 'string', 'in:agent,first_call_time,total_calls,connected,missed,total_duration,avg_duration'],
            'sort_order' => ['nullable', 'string', 'in:asc,desc'],
            'for_export' => ['nullable', 'boolean'],
        ];
    }
}

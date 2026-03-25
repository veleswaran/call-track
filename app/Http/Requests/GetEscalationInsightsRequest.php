<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GetEscalationInsightsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view escalations');
    }

    public function rules(): array
    {
        return [
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'status' => ['nullable', 'string', 'in:pending,unattended,resolved'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'contact_filter' => ['nullable', 'string', 'in:all,internal,external'],
        ];
    }
}

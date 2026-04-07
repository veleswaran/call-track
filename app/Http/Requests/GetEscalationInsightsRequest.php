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
            'team_ids' => ['nullable', 'array'],
            'team_ids.*' => ['integer', 'exists:teams,id'],
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'status' => ['nullable', function ($attribute, $value, $fail) {
                $allowed = ['pending', 'unattended', 'resolved'];
                $statuses = is_array($value) ? $value : explode(',', (string) $value);
                foreach ($statuses as $status) {
                    if (! in_array(trim($status), $allowed)) {
                        $fail(__('validation.in', ['attribute' => $attribute]));
                    }
                }
            }],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'contact_filter' => ['nullable', 'string', 'in:all,internal,external'],
        ];
    }
}

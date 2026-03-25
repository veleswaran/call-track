<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('admin');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'employee_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('agents', 'employee_code')->ignore($this->route('agent')),
            ],
            'agent_status_id' => ['required', 'exists:agent_statuses,id'],
        ];
    }
}

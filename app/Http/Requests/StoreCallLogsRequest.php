<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCallLogsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Middleware handles auth
    }

    public function rules(): array
    {
        return [
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'logs' => ['present', 'array', 'max:1000'],
            'logs.*.call_hash' => ['required', 'string'],
            'logs.*.phone_number' => ['required', 'string'],
            'logs.*.direction' => ['required', 'in:INCOMING,OUTGOING,MISSED,UNKNOWN'],
            'logs.*.duration' => ['required', 'integer', 'min:0'],
            'logs.*.timestamp' => ['required', 'date'],
            'logs.*.sim_slot' => ['nullable', 'integer'],
            'logs.*.phone_contact_name' => ['nullable', 'string', 'max:255'],
            'logs.*.extra' => ['nullable', 'array'],
            'logs.*.extra.classification' => ['required_with:logs.*.extra', 'in:BUSINESS,PERSONAL,IGNORED'],
            'logs.*.extra.note' => ['nullable', 'string', 'max:1000'],
            'logs.*.extra.metadata' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

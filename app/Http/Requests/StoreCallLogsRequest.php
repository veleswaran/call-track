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
            'logs' => ['required', 'array', 'max:1000'],
            'logs.*.call_hash' => ['required', 'string'],
            'logs.*.phone_number' => ['required', 'string'],
            'logs.*.direction' => ['required', 'in:INCOMING,OUTGOING,MISSED'],
            'logs.*.duration' => ['required', 'integer', 'min:0'],
            'logs.*.timestamp' => ['required', 'date'],
            'logs.*.sim_slot' => ['nullable', 'integer'],
        ];
    }
}

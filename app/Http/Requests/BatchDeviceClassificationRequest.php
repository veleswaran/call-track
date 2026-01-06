<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchDeviceClassificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Middleware handles auth
    }

    public function rules(): array
    {
        return [
            'classifications' => ['required', 'array', 'min:1'],
            'classifications.*.call_hash' => ['required', 'string'],
            'classifications.*.type' => ['required', 'string', 'in:BUSINESS,PERSONAL,IGNORED'],
            'classifications.*.note' => ['nullable', 'string'],
        ];
    }
}

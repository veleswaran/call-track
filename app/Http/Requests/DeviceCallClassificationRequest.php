<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceCallClassificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:BUSINESS,PERSONAL,IGNORED'],
            'note' => ['nullable', 'string'],
        ];
    }
}

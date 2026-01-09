<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterDeviceWithCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Open endpoint
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string'],
            'device_uuid' => ['nullable', 'string', 'uuid'],
            'device_name' => ['required', 'string'],
            'device_model' => ['nullable', 'string'],
            'os_version' => ['nullable', 'string'],
            'app_version' => ['nullable', 'string'],
            'tracked_sim_slots' => ['nullable', 'array'],
            'tracked_sim_slots.*' => ['integer'],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage users'); // Assuming permission exists, or use generic logic
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'employee_code' => ['nullable', 'string'],
            'team_id' => ['nullable', 'string'],
        ];
    }
}

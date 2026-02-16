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
            'role' => [
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    $value = strtolower($value);
                    $allowedRoles = ['member', 'manager'];
                    if ($this->user()->hasRole('super-admin')) {
                        $allowedRoles = ['super-admin', 'admin', 'manager', 'member'];
                    } elseif ($this->user()->hasRole('admin')) {
                        $allowedRoles = ['admin', 'manager', 'member'];
                    }

                    if (! in_array($value, $allowedRoles)) {
                        $fail("You are not authorized to assign the role {$value}.");
                    }
                },
            ],
            'status' => ['nullable', 'string'],
            'employee_code' => ['nullable', 'string'],
            'team_id' => ['nullable', 'integer'],
            'is_agent' => ['nullable', 'boolean'],
            'is_team' => ['nullable', 'boolean'],
        ];
    }
}

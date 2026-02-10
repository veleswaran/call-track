<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->tokenCan('admin');
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:BUSINESS,PERSONAL,IGNORED'],
            'note' => ['nullable', 'string', 'max:1000'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}

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
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}

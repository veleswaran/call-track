<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Devices\DTOs\SendPushNotificationDTO;
use Illuminate\Foundation\Http\FormRequest;

class SendDevicePushNotificationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super-admin', 'admin']) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
        ];
    }

    /**
     * Build an immutable DTO from the validated request data.
     */
    public function toDTO(int $deviceId): SendPushNotificationDTO
    {
        $validated = $this->validated();

        return new SendPushNotificationDTO(
            deviceId: $deviceId,
            title: $validated['title'] ?? null,
            body: $validated['body'] ?? null,
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests\Device;

use App\Domain\Devices\DTOs\StoreDeviceEventDTO;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class StoreDeviceEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'event_type' => ['required', 'string'],
            'payload' => ['nullable', 'array'],
            'occurred_at' => ['required', 'date'],
        ];
    }

    public function toDTO(int $deviceId): StoreDeviceEventDTO
    {
        return new StoreDeviceEventDTO(
            deviceId: $deviceId,
            eventType: $this->validated('event_type'),
            payload: $this->validated('payload'),
            occurredAt: Carbon::parse($this->validated('occurred_at')),
        );
    }
}

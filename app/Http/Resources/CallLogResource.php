<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Calls\Models\CallLog
 */
class CallLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'device_id' => $this->device_id,
            'phone_number' => $this->phone_number, // Auto-decrypted by encrypted cast
            'call_type' => strtolower($this->direction),
            'duration' => $this->duration,
            'timestamp' => $this->timestamp,
            'classification' => $this->classification ? [
                'id' => $this->classification->id,
                'classification' => strtolower($this->classification->type),
                'classified_by' => $this->classification->user_id,
                'classified_at' => $this->classification->created_at,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}

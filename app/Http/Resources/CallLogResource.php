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
        // Optimized: contacts are batch-attached in the controller via a precomputed phone_hash map.
        // We simply read the relation here to avoid per-row queries (N+1).
        $contact = $this->getRelationValue('contact_by_hash');

        /** @var \App\Domain\Devices\Models\Device|null $device */
        $device = $this->getRelationValue('device');

        /** @var \App\Domain\Agents\Models\Agent|null $agent */
        $agent = $device?->agent;

        return [
            'id' => $this->id,
            'device_id' => $this->device_id,
            'device_name' => $device?->name,
            'agent_name' => $agent?->name,
            'phone_number' => $this->phone_number, // Auto-decrypted by encrypted cast
            'call_type' => strtolower($this->direction),
            'duration' => $this->duration,
            'timestamp' => $this->timestamp,
            'contact_name' => $contact?->name,
            'contact_notes' => $contact?->notes,
            'classification' => $this->classification ? [
                'id' => $this->classification->id,
                'classification' => strtolower($this->classification->type),
                'classified_by' => $this->classification->user_id,
                'classified_at' => $this->classification->created_at,
            ] : null,
            'notes' => $this->notes->map(fn (\App\Domain\Classification\Models\CallNote $note) => [
                'id' => $note->id,
                'note' => $note->note,
                'agent_id' => $note->agent_id,
                'created_at' => $note->created_at,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}

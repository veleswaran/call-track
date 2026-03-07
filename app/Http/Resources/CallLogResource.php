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
        $agent = $this->getRelationValue('agent');

        return [
            'id' => $this->id,
            'device_id' => $this->device_id,
            'sim_slot' => $this->sim_slot,
            'device_name' => $device?->name,
            'agent_name' => $agent?->name,
            'phone_number' => $this->phone_number, // Auto-decrypted by encrypted cast
            'call_type' => strtolower($this->direction),
            'call_outcome' => $this->deriveCallOutcome(),
            'duration' => $this->duration,
            'timestamp' => $this->timestamp->format('Y-m-d H:i:s'),
            'phone_contact_name' => $this->phone_contact_name,
            'contact_name' => $contact?->name,
            'contact_notes' => $contact?->notes,
            'classification' => $this->classification ? [
                'id' => $this->classification->id,
                'classification' => strtolower($this->classification->type),
                'classified_by' => $this->classification->user_id,
                'classified_at' => $this->classification->created_at,
                'note' => $this->classification->note,
                'metadata' => $this->classification->metadata,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Derive unified call outcome from direction and duration.
     *
     * Connected = duration > 0 (any direction)
     * Missed = MISSED | REJECTED | BLOCKED | (INCOMING with duration 0)
     * No Answer = OUTGOING with duration 0
     */
    private function deriveCallOutcome(): string
    {
        if ($this->duration > 0) {
            return 'Connected';
        }

        $direction = strtoupper($this->direction);

        if (in_array($direction, ['MISSED', 'REJECTED', 'BLOCKED', 'INCOMING'])) {
            return 'Missed';
        }

        return 'No Answer';
    }
}

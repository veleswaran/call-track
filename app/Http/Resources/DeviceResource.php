<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Devices\Models\Device
 */
class DeviceResource extends JsonResource
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
            'device_identifier' => $this->id, // Using ID as identifier for now
            'device_uuid' => $this->device_uuid,
            'device_name' => $this->name,
            'device_model' => $this->model,
            'os_version' => $this->os_version,
            'app_version' => $this->app_version,
            'tracked_sim_slots' => $this->tracked_sim_slots,
            'battery_level' => $this->battery_level,
            'status' => $this->active_tokens_exists ? 'active' : 'inactive',
            'agent_id' => $this->agent_id,
            'agent' => $this->whenLoaded('agent', fn () => [
                'id' => $this->resource->agent->id,
                'name' => $this->resource->agent->name,
            ]),
            'last_sync_at' => $this->created_at, // Placeholder or use specialized query
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

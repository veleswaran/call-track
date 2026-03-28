<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Calls\Models\CallEscalation
 */
class EscalationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'response_due_at' => $this->response_due_at->format('Y-m-d H:i:s'),
            'resolved_at' => $this->resolved_at?->format('Y-m-d H:i:s'),
            'call_log' => new CallLogResource($this->whenLoaded('callLog')),
            'resolved_by_call' => new CallLogResource($this->whenLoaded('resolvedByCall')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

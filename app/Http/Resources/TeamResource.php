<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Teams\Models\Team
 */
class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'members' => TeamMemberResource::collection($this->whenLoaded('members')),
            'members_count' => $this->members_count ?? 0,
            'managers_count' => $this->managers_count ?? 0,
        ];
    }
}

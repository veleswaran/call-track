<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Agents\Models\Agent
 *
 * @property \Illuminate\Database\Eloquent\Relations\Pivot $pivot
 */
class TeamMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->pivot->id ?? $this->id,
            'team_id' => $this->pivot->team_id ?? null,
            'agent_id' => $this->id,
            'role' => $this->pivot->role ?? 'MEMBER',
            'created_at' => $this->pivot->created_at ?? $this->created_at,
            'updated_at' => $this->pivot->updated_at ?? $this->updated_at,
            'agent' => [
                'id' => $this->id,
                'name' => $this->name,
                'employee_code' => $this->employee_code,
            ],
        ];
    }
}

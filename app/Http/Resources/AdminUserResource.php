<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Users\Models\User
 */
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'roles' => $this->getRoleNames(),
            'two_factor_enabled' => ! is_null($this->two_factor_secret),
            'two_factor_confirmed_at' => $this->two_factor_confirmed_at,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}

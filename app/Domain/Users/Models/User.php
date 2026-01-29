<?php

namespace App\Domain\Users\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /**
     * @property-read \App\Domain\Agents\Models\Agent|null $agent
     *
     * @use HasFactory<\Database\Factories\UserFactory>
     */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    public function agent(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Domain\Agents\Models\Agent::class);
    }

    public function isAgent(): bool
    {
        // Check if the agent relation exists (if loaded, use it; otherwise check DB existence?
        // Actually, easiest is to check if agent is not null.
        // Assuming developer will eager load 'agent' when needed, or lazy load occurs.
        return $this->agent !== null;
    }

    /**
     * Get teams where this user's agent has a 'MANAGER' role.
     */
    public function managedTeams(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        /** @var \App\Domain\Agents\Models\Agent|null $agent */
        $agent = $this->agent;

        if (! $agent) {
            // Return empty relation if no agent linked
            // We can't easily return an empty BelongsToMany without a query builder trick or similar.
            // But for now let's just assume we return the relation off the agent if exists.
            // If no agent, we can't really return a valid BelongsToMany properly scoped to THIS user easily without an empty query.
            // A common trick is to query a relation that returns nothing.
            // Or better, just return the relationship definition but with a condition that fails.
            // However, since we are accessing $agent->teams(), we MUST have an agent.

            // Workaround: Return a dummy relation or throw?
            // Safest for logic:
            return $this->belongsToMany(\App\Domain\Teams\Models\Team::class, 'team_members', 'agent_id', 'team_id')
                ->whereRaw('1 = 0');
        }

        return $agent->teams()->wherePivot('role', 'MANAGER');
    }

    protected static function newFactory()
    {
        return \Database\Factories\UserFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_secret' => 'encrypted',
        ];
    }
}

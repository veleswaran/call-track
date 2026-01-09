<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

interface TeamServiceInterface
{
    public function createTeam(string $name): Team;

    public function addAgent(Team $team, Agent $agent): void;

    public function assignManager(Team $team, Agent $agent): void;

    public function getAllTeams(): Collection;
}

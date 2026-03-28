<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we have agents to work with
        if (Agent::count() === 0) {
            $this->command->warn('No agents found. Creating some for team seeding...');
            Agent::factory()->count(10)->create();
        }

        $agents = Agent::all();

        // Create Sales Team
        $salesTeam = Team::firstOrCreate(['name' => 'Sales Team']);

        // Assign first agent as Manager
        $manager = $agents->first();
        if ($manager) {
            $this->ensureUserExists($manager, 'manager');
            $salesTeam->members()->syncWithoutDetaching([
                $manager->id => ['role' => 'MANAGER'],
            ]);
        }

        // Assign next 3 agents as Members
        $members = $agents->slice(1, 3);
        foreach ($members as $member) {
            $this->ensureUserExists($member, 'member');
            $salesTeam->members()->syncWithoutDetaching([
                $member->id => ['role' => 'MEMBER'],
            ]);
        }

        $this->command->info('Created Sales Team with 1 Manager and '.$members->count().' Members.');

        // Create Support Team
        $supportTeam = Team::firstOrCreate(['name' => 'Support Team']);

        // Assign 5th agent as Manager
        $supportManager = $agents->get(4);
        if ($supportManager) {
            $this->ensureUserExists($supportManager, 'manager');
            $supportTeam->members()->syncWithoutDetaching([
                $supportManager->id => ['role' => 'MANAGER'],
            ]);
        }

        $this->command->info('Created Support Team with 1 Manager.');
    }

    private function ensureUserExists(?Agent $agent, string $role): void
    {
        if (! $agent) {
            return;
        }

        if (! $agent->user_id) {
            // Create user
            $email = strtolower(str_replace(' ', '.', $agent->name)).'@calltrack.com';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $agent->name,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
            $agent->update(['user_id' => $user->id]);
        }

        if ($agent->user) {
            $agent->user->assignRole($role);
        }
    }
}

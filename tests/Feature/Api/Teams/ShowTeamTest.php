<?php

namespace Tests\Feature\Api\Teams;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShowTeamTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_view_team_details_with_resource_structure()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::factory()->create(['name' => 'Resource Team']);
        $agent = Agent::factory()->create();
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);

        $response = $this->actingAs($admin)->getJson("/api/v1/admin/teams/{$team->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'created_at',
                    'members' => [
                        '*' => [
                            'id',
                            'agent_id',
                            'role',
                            'agent' => [
                                'id',
                                'name',
                            ],
                        ],
                    ],
                    'members_count',
                    'managers_count',
                ],
            ]);
    }
}

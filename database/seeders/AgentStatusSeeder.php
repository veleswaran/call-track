<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Agents\Models\AgentStatus;
use Illuminate\Database\Seeder;

class AgentStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = [
            [
                'name' => 'Active',
                'color' => '#10b981', // Emerald 500
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Inactive',
                'color' => '#6b7280', // Gray 500
                'is_default' => false,
                'is_active' => true,
            ],
        ];

        foreach ($statuses as $status) {
            AgentStatus::firstOrCreate(['name' => $status['name']], $status);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Domain\Devices\Models\DeviceStatus;
use Illuminate\Database\Seeder;

class DeviceStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'name' => 'Active',
                'color' => '#22c55e', // text-green-500
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Suspended',
                'color' => '#ef4444', // text-red-500
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Maintenance',
                'color' => '#eab308', // text-yellow-500
                'is_default' => false,
                'is_active' => true,
            ],
        ];

        foreach ($statuses as $status) {
            DeviceStatus::firstOrCreate(
                ['name' => $status['name']],
                $status
            );
        }
    }
}

<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds demo data for development and testing
 */
class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@calltrack.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Created admin user: admin@calltrack.com / password');

        // Create agents (matching actual schema: name, employee_code, status)
        $agents = [
            ['name' => 'John Smith', 'employee_code' => 'EMP001', 'status' => 'active'],
            ['name' => 'Sarah Johnson', 'employee_code' => 'EMP002', 'status' => 'active'],
            ['name' => 'Mike Williams', 'employee_code' => 'EMP003', 'status' => 'active'],
            ['name' => 'Emily Brown', 'employee_code' => 'EMP004', 'status' => 'active'],
        ];

        $createdAgents = [];
        foreach ($agents as $agentData) {
            $createdAgents[] = Agent::firstOrCreate(
                ['employee_code' => $agentData['employee_code']],
                $agentData
            );
        }

        $this->command->info('Created '.count($createdAgents).' agents');

        // Create devices (matching actual schema: name, model, os_version, app_version, agent_id)
        $devices = [
            ['name' => 'Pixel 7 Pro', 'model' => 'Pixel 7 Pro', 'os_version' => 'Android 14', 'app_version' => '1.2.0'],
            ['name' => 'Samsung S23', 'model' => 'Galaxy S23', 'os_version' => 'Android 14', 'app_version' => '1.2.0'],
            ['name' => 'OnePlus 11', 'model' => 'OnePlus 11', 'os_version' => 'Android 13', 'app_version' => '1.1.5'],
            ['name' => 'Pixel 6a', 'model' => 'Pixel 6a', 'os_version' => 'Android 14', 'app_version' => '1.2.0'],
            ['name' => 'Samsung A54', 'model' => 'Galaxy A54', 'os_version' => 'Android 14', 'app_version' => '1.2.0'],
        ];

        $createdDevices = [];
        foreach ($devices as $index => $deviceData) {
            $device = Device::firstOrCreate(
                ['name' => $deviceData['name']],
                array_merge($deviceData, [
                    'agent_id' => $createdAgents[$index % count($createdAgents)]->id,
                    'device_uuid' => Str::uuid()->toString(),
                ])
            );
            $createdDevices[] = $device;

            // Create device token
            DB::table('device_tokens')->insertOrIgnore([
                'device_id' => $device->id,
                'token_hash' => 'demo_token_'.Str::random(40),
                'device_name' => $deviceData['name'],
                'last_used_at' => now()->subHours(rand(1, 48)),
                'issued_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Created '.count($createdDevices).' devices');

        // Create call logs
        $phoneNumbers = [
            '+1-555-8000', '+1-555-8001', '+1-555-8002', '+1-555-8003', '+1-555-8004',
            '+1-555-8005', '+1-555-8006', '+1-555-8007', '+1-555-8008', '+1-555-8009',
            '+1-555-9000', '+1-555-9001', '+1-555-9002', '+1-555-9003', '+1-555-9004',
        ];

        $directions = ['INCOMING', 'OUTGOING', 'MISSED'];
        $classifications = ['BUSINESS', 'PERSONAL', 'IGNORED', null, null]; // 40% unclassified

        $callLogsCount = 0;
        $classificationsCount = 0;

        foreach ($createdDevices as $device) {
            // Create 20-50 calls per device over the past 7 days
            $numCalls = rand(20, 50);

            for ($i = 0; $i < $numCalls; $i++) {
                $phoneNumber = $phoneNumbers[array_rand($phoneNumbers)];
                $direction = $directions[array_rand($directions)];
                $timestamp = now()->subDays(rand(0, 7))->subHours(rand(0, 23))->subMinutes(rand(0, 59));
                $duration = $direction === 'MISSED' ? 0 : rand(15, 600);

                /** @var \App\Domain\Calls\Models\CallLog $callLog */
                $callLog = \App\Domain\Calls\Models\CallLog::create([
                    'device_id' => $device->id,
                    'call_hash' => md5($device->id.$phoneNumber.$timestamp->timestamp.$i),
                    'phone_number_hash' => hash('sha256', $phoneNumber),
                    'phone_number' => $phoneNumber, // Model cast will encrypt this
                    'sim_slot' => rand(0, 1),
                    'direction' => $direction,
                    'duration' => $duration,
                    'timestamp' => $timestamp,
                    'created_at' => $timestamp,
                ]);

                $callLogsCount++;

                // Add classification for some calls
                $classificationType = $classifications[array_rand($classifications)];
                if ($classificationType !== null) {
                    \App\Domain\Classification\Models\CallClassification::create([
                        'call_log_id' => $callLog->id,
                        'user_id' => $admin->id,
                        'type' => $classificationType,
                        'reason' => $classificationType === 'BUSINESS' ? 'Client call' : ($classificationType === 'PERSONAL' ? 'Family call' : 'Spam'),
                    ]);
                    $classificationsCount++;
                }
            }
        }

        $this->command->info("Created {$callLogsCount} call logs with {$classificationsCount} classifications");
    }
}

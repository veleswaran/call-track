<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Agents\Models\Agent;
use App\Domain\Analytics\Actions\UpdateLoyaltyMetricsAction;
use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Devices\Models\Device;
use App\Domain\Settings\Models\SystemSetting;
use App\Domain\Users\Models\User;
use App\Support\PhoneNormalizer;
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
        // 0. Clean up existing data for a fresh demo
        $this->command->info('Cleaning up existing call data...');
        DB::table('call_escalations')->delete();
        DB::table('call_classifications')->delete();
        DB::table('call_logs')->delete();
        DB::table('analytics_customer_loyalty')->delete();

        // 0. Ensure System Settings
        SystemSetting::firstOrCreate(
            ['key' => 'min_interaction_duration'],
            ['value' => 10]
        );

        // 1. Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@calltrack.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        if (class_exists(\Spatie\Permission\Models\Role::class)) {
            $admin->assignRole('admin');
        }

        $this->command->info('Created admin user: admin@calltrack.com / password');

        // 2. Create agents
        $agentNames = [
            'John Smith', 'Sarah Johnson', 'Mike Williams', 'Emily Brown',
            'David Jones', 'Jessica Taylor', 'Chris Evans', 'Amanda White',
            'Robert Miller', 'Lisa Anderson',
        ];

        $createdAgents = [];
        foreach ($agentNames as $index => $name) {
            $empCode = 'EMP'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
            $email = strtolower(str_replace(' ', '.', $name)).'@calltrack.com';

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            if (class_exists(\Spatie\Permission\Models\Role::class) && ! $user->hasRole('member')) {
                $user->assignRole('member');
            }

            $createdAgents[] = Agent::firstOrCreate(
                ['employee_code' => $empCode],
                ['name' => $name, 'user_id' => $user->id, 'status' => 'active']
            );
        }

        $this->command->info('Created '.count($createdAgents).' agents');

        // 3. Create devices (some agents have 2 devices)
        $deviceSpecs = [
            ['name' => 'Pixel 7 Pro', 'model' => 'Pixel 7 Pro', 'os_version' => 'Android 14'],
            ['name' => 'Samsung S23', 'model' => 'Galaxy S23', 'os_version' => 'Android 14'],
            ['name' => 'OnePlus 11', 'model' => 'OnePlus 11', 'os_version' => 'Android 13'],
            ['name' => 'Pixel 6a', 'model' => 'Pixel 6a', 'os_version' => 'Android 14'],
            ['name' => 'Samsung A54', 'model' => 'Galaxy A54', 'os_version' => 'Android 14'],
            ['name' => 'Pixel 8', 'model' => 'Pixel 8', 'os_version' => 'Android 14'],
            ['name' => 'Nokia G42', 'model' => 'Nokia G42', 'os_version' => 'Android 13'],
            ['name' => 'Moto G84', 'model' => 'Moto G84', 'os_version' => 'Android 13'],
            ['name' => 'Xiaomi 13', 'model' => 'Xiaomi 13', 'os_version' => 'Android 14'],
            ['name' => 'Asus Zenfone 10', 'model' => 'Zenfone 10', 'os_version' => 'Android 13'],
            ['name' => 'Sony Xperia 5 V', 'model' => 'Xperia 5 V', 'os_version' => 'Android 14'],
            ['name' => 'Nothing Phone 2', 'model' => 'Phone 2', 'os_version' => 'Android 13'],
            ['name' => 'Pixel 7a', 'model' => 'Pixel 7a', 'os_version' => 'Android 14'],
            ['name' => 'Samsung S22', 'model' => 'Galaxy S22', 'os_version' => 'Android 13'],
            ['name' => 'Pixel 5', 'model' => 'Pixel 5', 'os_version' => 'Android 13'],
        ];

        $createdDevices = [];
        $statusIds = \App\Domain\Devices\Models\DeviceStatus::pluck('id')->toArray();
        $defaultStatusId = \App\Domain\Devices\Models\DeviceStatus::where('is_default', true)->value('id');

        foreach ($deviceSpecs as $index => $spec) {
            $agent = $createdAgents[$index % count($createdAgents)];
            // Mostly active/default, sometimes suspended
            $statusId = empty($statusIds) ? null : ((rand(1, 10) > 8) ? $statusIds[array_rand($statusIds)] : $defaultStatusId);

            $device = Device::firstOrCreate(
                ['name' => $spec['name'].' ('.$agent->name.')'],
                array_merge($spec, [
                    'agent_id' => $agent->id,
                    'device_uuid' => Str::uuid()->toString(),
                    'app_version' => '1.2.'.rand(0, 9),
                    'device_status_id' => $statusId,
                ])
            );
            $createdDevices[] = $device;

            // Create device token
            DB::table('device_tokens')->updateOrInsert(
                ['device_id' => $device->id],
                [
                    'token_hash' => 'demo_token_'.Str::random(40),
                    'device_name' => $spec['name'],
                    'last_used_at' => now()->subHours(rand(1, 48)),
                    'issued_at' => now()->subDays(30),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('Created '.count($createdDevices).' devices');

        // 4. Create call logs over 30 days
        $phoneNumbers = [
            '+91 98765 43210', '+91 87654 32109', '+91 76543 21098', '+91 65432 10987',
            '+91 54321 09876', '+91 99887 76655', '+91 88776 65544', '+91 77665 54433',
            '+91 66554 43322', '+91 55443 32211', '+91 91234 56789', '+91 82345 67890',
            '+91 73456 78901', '+91 64567 89012', '+91 55678 90123',
        ];

        $contactNames = [
            'Rahul Sharma', 'Anjali Gupta', 'Vikram Singh', 'Priya Verma',
            'Amit Patel', 'Sonia Reddy', 'Rajesh Kumar', 'Deepa Nair',
            'Arun Joshi', 'Kavita Iyer', null, null, null, null, null,
        ];

        $directions = ['INCOMING', 'OUTGOING', 'MISSED', 'REJECTED', 'BLOCKED'];
        $classifications = ['BUSINESS', 'PERSONAL', 'IGNORED'];

        $callLogsCount = 0;
        $uniquePhoneHashes = [];

        foreach ($createdDevices as $device) {
            // 50-100 calls per device over 30 days
            $numCalls = rand(50, 100);

            for ($i = 0; $i < $numCalls; $i++) {
                $phoneIdx = array_rand($phoneNumbers);
                $rawPhone = $phoneNumbers[$phoneIdx];
                $phoneNumber = PhoneNormalizer::normalize($rawPhone);
                $phoneHash = hash('sha256', $phoneNumber);
                $uniquePhoneHashes[$phoneHash] = true;

                $direction = $directions[array_rand($directions)];
                // Higher probability for INCOMING/OUTGOING
                if (rand(1, 10) > 7) {
                    $direction = $directions[rand(2, 4)]; // MISSED, REJECTED, BLOCKED
                } else {
                    $direction = $directions[rand(0, 1)]; // INCOMING, OUTGOING
                }

                $timestamp = now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));

                $isMissed = in_array($direction, ['MISSED', 'REJECTED', 'BLOCKED']) || ($direction === 'INCOMING' && rand(1, 10) > 8);
                $duration = $isMissed ? 0 : rand(10, 1200);

                $callLog = CallLog::create([
                    'device_id' => $device->id,
                    'agent_id' => $device->agent_id,
                    'call_hash' => md5($device->id.$phoneNumber.$timestamp->timestamp.$i.Str::random(5)),
                    'phone_number_hash' => $phoneHash,
                    'phone_number' => $phoneNumber,
                    'phone_contact_name' => $contactNames[$phoneIdx],
                    'sim_slot' => rand(0, 1),
                    'direction' => $direction,
                    'duration' => $duration,
                    'timestamp' => $timestamp,
                    'created_at' => $timestamp,
                ]);

                $callLogsCount++;

                // 5. Add Classification
                $type = $classifications[array_rand($classifications)];
                // 70% business
                if (rand(1, 10) <= 7) {
                    $type = 'BUSINESS';
                }

                CallClassification::create([
                    'call_log_id' => $callLog->id,
                    'user_id' => $admin->id,
                    'type' => $type,
                    'note' => $type === 'BUSINESS' ? 'Inquiry about service' : ($type === 'PERSONAL' ? 'Personal call' : 'Spam/Ignored'),
                ]);

                // 6. Handle Escalations for Missed Calls
                if ($isMissed && $type === 'BUSINESS') {
                    $status = ['pending', 'unattended', 'resolved'][rand(0, 2)];

                    $escalation = CallEscalation::create([
                        'call_log_id' => $callLog->id,
                        'status' => $status,
                        'response_due_at' => $timestamp->copy()->addHours(4),
                    ]);

                    if ($status === 'resolved') {
                        // Create a follow-up call to resolve it
                        $resolvedAt = $timestamp->copy()->addMinutes(rand(30, 180));
                        $followUpCall = CallLog::create([
                            'device_id' => $device->id,
                            'agent_id' => $device->agent_id,
                            'call_hash' => md5($device->id.$phoneNumber.$resolvedAt->timestamp.'followup'.Str::random(5)),
                            'phone_number_hash' => $phoneHash,
                            'phone_number' => $phoneNumber,
                            'direction' => 'OUTGOING',
                            'duration' => rand(60, 300),
                            'timestamp' => $resolvedAt,
                            'created_at' => $resolvedAt,
                        ]);

                        $escalation->update([
                            'resolved_at' => $resolvedAt,
                            'resolved_by_call_id' => $followUpCall->id,
                        ]);
                    }
                }
            }
        }

        $this->command->info("Created {$callLogsCount} call logs.");

        // 7. Update Loyalty Metrics
        $this->command->info('Updating loyalty metrics...');
        $loyaltyAction = app(UpdateLoyaltyMetricsAction::class);
        foreach (array_keys($uniquePhoneHashes) as $hash) {
            $loyaltyAction->execute($hash);
        }

        $this->command->info('Demo data seeding completed successfully!');
    }
}

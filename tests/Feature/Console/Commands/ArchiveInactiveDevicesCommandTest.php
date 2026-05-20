<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Actions\Devices\ListDevicesAction;
use App\Domain\Devices\DTOs\ListDevicesDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ArchiveInactiveDevicesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_archives_devices_inactive_for_more_than_15_days(): void
    {
        // 1. Inactive device (>15 days based on heartbeat)
        $staleHeartbeatDevice = Device::factory()->create([
            'name' => 'Stale Heartbeat Device',
            'last_heartbeat_at' => Carbon::now()->subDays(16),
        ]);

        // 2. Inactive device (>15 days based on updated_at and null heartbeat)
        $staleCreatedDevice = Device::factory()->create([
            'name' => 'Stale Created Device',
            'last_heartbeat_at' => null,
            'created_at' => Carbon::now()->subDays(16),
            'updated_at' => Carbon::now()->subDays(16),
        ]);

        // 3. Recently active device (<15 days based on heartbeat)
        $freshDevice = Device::factory()->create([
            'name' => 'Fresh Device',
            'last_heartbeat_at' => Carbon::now()->subDays(5),
        ]);

        // 4. Run the artisan command
        $this->artisan('devices:archive-inactive --days=15')
            ->expectsOutput('Archiving devices inactive for more than 15 days...')
            ->expectsOutput('Successfully archived 2 inactive devices.')
            ->assertExitCode(0);

        // 5. Assert database transitions
        $this->assertTrue($staleHeartbeatDevice->refresh()->is_archived);
        $this->assertTrue($staleCreatedDevice->refresh()->is_archived);
        $this->assertFalse($freshDevice->refresh()->is_archived);

        // 6. Assert ListDevicesAction query excludes archived devices
        $listAction = app(ListDevicesAction::class);
        $dto = new ListDevicesDTO(page: 1, perPage: 10);
        $paginator = $listAction->execute($dto);

        $this->assertCount(1, $paginator->items());
        $this->assertEquals($freshDevice->id, $paginator->items()[0]->id);
    }

    public function test_it_archives_devices_based_on_system_setting_with_no_cli_option(): void
    {
        // 1. Configure the system setting for device archive days to be 30 days
        \App\Domain\Settings\Models\SystemSetting::create([
            'key' => 'device_archive_days',
            'value' => 30,
        ]);

        // 2. Inactive device (>30 days)
        $staleDevice = Device::factory()->create([
            'name' => 'Stale Device 35 Days',
            'last_heartbeat_at' => Carbon::now()->subDays(35),
        ]);

        // 3. Recently active device (<30 days but >15 days)
        $freshDevice = Device::factory()->create([
            'name' => 'Fresh Device 20 Days',
            'last_heartbeat_at' => Carbon::now()->subDays(20),
        ]);

        // 4. Run the artisan command without the --days option
        $this->artisan('devices:archive-inactive')
            ->expectsOutput('Archiving devices inactive for more than 30 days...')
            ->expectsOutput('Successfully archived 1 inactive devices.')
            ->assertExitCode(0);

        // 5. Assert database transitions
        $this->assertTrue($staleDevice->refresh()->is_archived);
        $this->assertFalse($freshDevice->refresh()->is_archived);
    }
}

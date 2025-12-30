<?php

namespace Tests\Unit\Actions;

use App\Actions\Devices\ResolveOrCreateDeviceAction;
use App\Domain\Devices\DTOs\RegisterDeviceData;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ResolveOrCreateDeviceActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_new_device_if_uuid_not_found()
    {
        $data = new RegisterDeviceData(
            deviceUuid: Str::uuid()->toString(),
            name: 'New Device',
            model: 'Pixel',
            osVersion: '14',
            appVersion: '1.0'
        );

        $action = app(ResolveOrCreateDeviceAction::class);
        $result = $action->execute($data);

        $this->assertTrue($result['wasCreated']);
        $this->assertDatabaseHas('devices', ['device_uuid' => $data->deviceUuid]);
    }

    public function test_resolves_existing_device()
    {
        $uuid = Str::uuid()->toString();
        $device = Device::factory()->create([
            'device_uuid' => $uuid,
            'name' => 'Old Name'
        ]);

        $data = new RegisterDeviceData(
            deviceUuid: $uuid,
            name: 'New Name',
            model: 'Pixel',
            osVersion: '14',
            appVersion: '1.0'
        );

        $action = app(ResolveOrCreateDeviceAction::class);
        $result = $action->execute($data);

        $this->assertFalse($result['wasCreated']);
        $this->assertEquals($device->id, $result['device']->id);
        $this->assertEquals('New Name', $result['device']->name); // Check update
    }
    public function test_updates_agent_on_existing_device()
    {
        $oldAgent = \App\Domain\Agents\Models\Agent::factory()->create();
        $newAgent = \App\Domain\Agents\Models\Agent::factory()->create();
        
        $uuid = Str::uuid()->toString();
        $device = Device::factory()->create([
            'device_uuid' => $uuid,
            'agent_id' => $oldAgent->id,
        ]);
        
        $data = new RegisterDeviceData(
            deviceUuid: $uuid,
            name: 'Device',
            model: 'Pixel',
            osVersion: '14',
            appVersion: '1.0'
        );

        $action = app(ResolveOrCreateDeviceAction::class);
        $result = $action->execute($data, $newAgent->id);

        $this->assertEquals($newAgent->id, $result['device']->agent_id);
        $this->assertDatabaseHas('devices', [
            'id' => $device->id,
            'agent_id' => $newAgent->id,
        ]);
    }
}

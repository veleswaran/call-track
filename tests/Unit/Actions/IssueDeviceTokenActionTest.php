<?php

namespace Tests\Unit\Actions;

use App\Actions\Devices\IssueDeviceTokenAction;
use App\Domain\Devices\DTOs\IssueDeviceTokenDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IssueDeviceTokenActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_issues_a_new_token()
    {
        $device = Device::factory()->create();
        $dto = new IssueDeviceTokenDTO(
            deviceId: $device->id,
            deviceName: 'Test Device',
            expiresInDays: 30
        );

        $action = app(IssueDeviceTokenAction::class);
        $action = app(IssueDeviceTokenAction::class);
        
        $result = $action->execute($dto);

        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('plainTextToken', $result);
        
        $tokenRecord = $result['token'];
        $plainToken = $result['plainTextToken'];

        $this->assertEquals($device->id, $tokenRecord->device_id);
        $this->assertEquals('Test Device', $tokenRecord->device_name);
        $this->assertNotNull($tokenRecord->issued_at);
        $this->assertNotNull($tokenRecord->expires_at);
        // Verify expiry is roughly 30 days from now
        $this->assertTrue($tokenRecord->expires_at->diffInDays(now()->addDays(30)) < 1);
        
        // Verify hash matches
        $this->assertEquals(hash('sha256', $plainToken), $tokenRecord->token_hash);
    }
}

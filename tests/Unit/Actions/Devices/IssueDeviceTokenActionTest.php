<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Devices;

use App\Actions\Devices\IssueDeviceTokenAction;
use App\Domain\Devices\DTOs\IssueDeviceTokenDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IssueDeviceTokenActionTest extends TestCase
{
    use RefreshDatabase;

    private IssueDeviceTokenAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new IssueDeviceTokenAction;
    }

    public function test_it_issues_a_new_token(): void
    {
        $device = Device::factory()->create();
        $dto = new IssueDeviceTokenDTO(
            deviceId: $device->id,
            deviceName: $device->name,
            expiresInDays: 30
        );

        $result = $this->action->execute($dto);

        $this->assertArrayHasKey('plainTextToken', $result);
        $this->assertArrayHasKey('token', $result);

        $token = $result['token'];
        $this->assertEquals($device->id, $token->device_id);
        $this->assertEquals(hash('sha256', $result['plainTextToken']), $token->token_hash);
        $this->assertNotNull($token->issued_at);
        $this->assertNotNull($token->expires_at);
        $this->assertNull($token->revoked_at);

        $this->assertDatabaseHas('device_tokens', [
            'device_id' => $device->id,
            'token_hash' => $token->token_hash,
        ]);
    }
}

<?php

namespace Tests\Unit\Services;

use App\Actions\Agents\AssignAgentToDeviceAction;
use App\Actions\Agents\CreateAgentAction;
use App\Actions\Agents\UnassignAgentFromDeviceAction;
use App\Actions\Agents\UpdateAgentAction;
use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Services\Agents\AgentManagementService;
use Mockery;
use Tests\TestCase;

class AgentManagementServiceTest extends TestCase
{
    public function test_it_delegates_creation_to_action()
    {
        $action = Mockery::mock(CreateAgentAction::class);
        $service = new AgentManagementService(
            $action,
            Mockery::mock(UpdateAgentAction::class),
            Mockery::mock(AssignAgentToDeviceAction::class),
            Mockery::mock(UnassignAgentFromDeviceAction::class)
        );

        $dto = new AgentData(name: 'John Doe', employeeCode: 'EMP-001');
        $expectedAgent = new Agent;

        $action->shouldReceive('execute')
            ->once()
            ->with($dto)
            ->andReturn($expectedAgent);

        $result = $service->createAgent($dto);

        $this->assertEquals($expectedAgent, $result);
    }

    public function test_it_delegates_assignment_to_action()
    {
        $assignAction = Mockery::mock(AssignAgentToDeviceAction::class);
        $service = new AgentManagementService(
            Mockery::mock(CreateAgentAction::class),
            Mockery::mock(UpdateAgentAction::class),
            $assignAction,
            Mockery::mock(UnassignAgentFromDeviceAction::class)
        );

        $device = new Device;
        $agent = new Agent;

        $assignAction->shouldReceive('execute')
            ->once()
            ->with($device, $agent)
            ->andReturn($device);

        $result = $service->assignDevice($device, $agent);

        $this->assertEquals($device, $result);
    }
}

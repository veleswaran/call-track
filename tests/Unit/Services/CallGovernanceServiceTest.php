<?php

namespace Tests\Unit\Services;

use App\Actions\Classification\ClassifyCallAction;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use App\Services\Governance\CallGovernanceService;
use Mockery;
use Tests\TestCase;

class CallGovernanceServiceTest extends TestCase
{
    public function test_it_delegates_classification_to_action()
    {
        $action = Mockery::mock(ClassifyCallAction::class);
        $service = new CallGovernanceService($action);

        $dto = new CallClassificationDTO(
            callLogId: 1,
            adminUserId: 1,
            type: 'BUSINESS'
        );

        $action->shouldReceive('execute')
            ->once()
            ->with($dto);

        $service->classifyCall($dto);
    }
}

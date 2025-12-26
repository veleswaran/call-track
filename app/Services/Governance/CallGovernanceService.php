<?php

declare(strict_types=1);

namespace App\Services\Governance;

use App\Contracts\Services\CallGovernanceServiceInterface;
use App\Actions\Classification\ClassifyCallAction;
use App\Domain\Classification\DTOs\CallClassificationDTO;

class CallGovernanceService implements CallGovernanceServiceInterface
{
    public function __construct(
        protected ClassifyCallAction $classifyAction
    ) {}

    public function classifyCall(CallClassificationDTO $dto): void
    {
        $this->classifyAction->execute($dto);
    }
}

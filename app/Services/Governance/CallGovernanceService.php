<?php

declare(strict_types=1);

namespace App\Services\Governance;

use App\Actions\Classification\ClassifyCallAction;
use App\Contracts\Services\CallGovernanceServiceInterface;
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

    public function classifyCalls(array $dtos): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($dtos) {
            foreach ($dtos as $dto) {
                $this->classifyAction->execute($dto);
            }
        });
    }
}

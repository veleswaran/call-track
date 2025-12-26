<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Classification\DTOs\CallClassificationDTO;

interface CallGovernanceServiceInterface
{
    public function classifyCall(CallClassificationDTO $dto): void;
}

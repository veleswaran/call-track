<?php

declare(strict_types=1);

namespace App\Services\Devices;

use App\Contracts\Services\DeviceCodeServiceInterface;
use App\Domain\Devices\Actions\GenerateDeviceCodeAction;
use App\Domain\Devices\Actions\ListActiveDeviceCodesAction;
use App\Domain\Devices\DTOs\GenerateDeviceCodeDTO;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DeviceCodeService implements DeviceCodeServiceInterface
{
    public function __construct(
        protected GenerateDeviceCodeAction $generateDeviceCodeAction,
        protected ListActiveDeviceCodesAction $listActiveDeviceCodesAction
    ) {}

    public function generateCode(GenerateDeviceCodeDTO $dto): DeviceRegistrationCode
    {
        return $this->generateDeviceCodeAction->execute($dto);
    }

    public function listActiveCodes(int $perPage = 20): LengthAwarePaginator
    {
        return $this->listActiveDeviceCodesAction->execute($perPage);
    }
}

<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Devices\DTOs\GenerateDeviceCodeDTO;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DeviceCodeServiceInterface
{
    public function generateCode(GenerateDeviceCodeDTO $dto): DeviceRegistrationCode;

    public function listActiveCodes(int $perPage = 20): LengthAwarePaginator;
}

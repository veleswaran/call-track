<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\DTOs\GenerateDeviceCodeDTO;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use Illuminate\Support\Str;

class GenerateDeviceCodeAction
{
    public function execute(GenerateDeviceCodeDTO $dto): DeviceRegistrationCode
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (DeviceRegistrationCode::where('code', $code)->exists());

        return DeviceRegistrationCode::create([
            'code' => $code,
            'agent_id' => $dto->agentId,
            'expires_at' => $dto->expiresInHours !== null ? now()->addHours($dto->expiresInHours) : null,
        ]);
    }
}

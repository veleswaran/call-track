<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\IssueDeviceTokenDTO;
use App\Domain\Devices\DTOs\RegisterDeviceData;
use App\Domain\Devices\DTOs\RevokeTokensDTO;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use Illuminate\Support\Facades\DB;

class RegisterDeviceWithCodeAction
{
    public function __construct(
        protected ResolveOrCreateDeviceAction $resolveDevice,
        protected RevokeActiveTokensAction $revokeTokens,
        protected IssueDeviceTokenAction $issueToken,
    ) {}

    /**
     * @return array{device: Device, token: string}
     */
    public function execute(string $code, RegisterDeviceData $data): array
    {
        return DB::transaction(function () use ($code, $data) {
            $registrationCode = DeviceRegistrationCode::where('code', $code)
                ->whereNull('used_at')
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->lockForUpdate()
                ->firstOrFail();

            // 1. Resolve or Create Device
            $resolution = $this->resolveDevice->execute($data, $registrationCode->agent_id);
            $device = $resolution['device'];

            // 2. Revoke existing active tokens (Rotation)
            $this->revokeTokens->execute(new RevokeTokensDTO(
                deviceId: $device->id,
                reason: 're-registration'
            ));

            // 3. Issue new token
            $tokenResult = $this->issueToken->execute(new IssueDeviceTokenDTO(
                deviceId: $device->id,
                deviceName: $data->name,
            ));

            // 4. Update code usage
            $registrationCode->update([
                'used_at' => now(),
                'used_by_device_id' => $device->id,
            ]);

            return [
                'device' => $device,
                'token' => $tokenResult['plainTextToken'],
            ];
        });
    }
}

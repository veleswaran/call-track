<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

class RegisterDeviceData
{
    public function __construct(
        public readonly ?string $deviceUuid,
        public readonly string $name,
        public readonly string $model,
        public readonly string $osVersion,
        public readonly string $appVersion,
        public readonly ?array $trackedSimSlots = null,
        public readonly ?array $metadata = null,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            deviceUuid: isset($data['device_uuid']) ? (string) $data['device_uuid'] : null,
            name: (string) $data['name'],
            model: (string) $data['model'],
            osVersion: (string) $data['os_version'],
            appVersion: (string) $data['app_version'],
            trackedSimSlots: $data['tracked_sim_slots'] ?? null,
            metadata: $data['metadata'] ?? null,
        );
    }
}

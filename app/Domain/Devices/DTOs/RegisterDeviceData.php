<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

class RegisterDeviceData
{
    public function __construct(
        public readonly string $name,
        public readonly string $model,
        public readonly string $osVersion,
        public readonly string $appVersion,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) $data['name'],
            model: (string) $data['model'],
            osVersion: (string) $data['os_version'],
            appVersion: (string) $data['app_version'],
        );
    }
}

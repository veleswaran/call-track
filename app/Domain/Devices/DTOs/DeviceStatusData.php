<?php
declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

readonly class DeviceStatusData
{
    public function __construct(
        public string $name,
        public string $color,
        public bool $is_default = false,
        public bool $is_active = true,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            color: $data['color'] ?? '#6b7280',
            is_default: (bool) ($data['is_default'] ?? false),
            is_active: (bool) ($data['is_active'] ?? true),
        );
    }
}

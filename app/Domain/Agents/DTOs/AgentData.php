<?php

declare(strict_types=1);

namespace App\Domain\Agents\DTOs;

class AgentData
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $employeeCode = null,
        public readonly string $status = 'active',
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) $data['name'],
            employeeCode: $data['employee_code'] ?? null,
            status: $data['status'] ?? 'active',
        );
    }
}

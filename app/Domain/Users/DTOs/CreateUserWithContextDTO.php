<?php

declare(strict_types=1);

namespace App\Domain\Users\DTOs;

readonly class CreateUserWithContextDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public bool $isAgent = false,
        public ?string $employeeCode = null,
        public ?string $status = null,
        public ?string $role = null,
        public bool $isTeam = false,
        public ?int $teamId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) $data['name'],
            email: (string) $data['email'],
            password: (string) $data['password'],
            isAgent: (bool) ($data['is_agent'] ?? false),
            employeeCode: $data['employee_code'] ?? null,
            status: $data['status'] ?? 'active',
            role: $data['role'] ?? null,
            isTeam: (bool) ($data['is_team'] ?? false),
            teamId: isset($data['team_id']) ? (int) $data['team_id'] : null,
        );
    }
}

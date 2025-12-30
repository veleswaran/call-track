<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

/**
 * Result of device token validation.
 */
readonly class DeviceTokenValidationResult
{
    public const ERROR_NONE = null;
    public const ERROR_MISSING = 'TOKEN_MISSING';
    public const ERROR_INVALID = 'TOKEN_INVALID';
    public const ERROR_EXPIRED = 'TOKEN_EXPIRED';
    public const ERROR_REVOKED = 'TOKEN_REVOKED';

    public function __construct(
        public bool $isValid,
        public ?string $errorCode = null,
        public ?int $deviceId = null,
        public ?int $tokenId = null,
    ) {}

    public static function success(int $deviceId, int $tokenId): self
    {
        return new self(
            isValid: true,
            errorCode: null,
            deviceId: $deviceId,
            tokenId: $tokenId,
        );
    }

    public static function failure(string $errorCode): self
    {
        return new self(
            isValid: false,
            errorCode: $errorCode,
        );
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Settings\DTOs;

final class UpdateSettingsDTO
{
    /**
     * @param  array<string, mixed>  $settings
     */
    public function __construct(
        public readonly array $settings,
    ) {}
}

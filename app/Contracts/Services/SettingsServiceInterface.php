<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Settings\DTOs\UpdateSettingsDTO;

interface SettingsServiceInterface
{
    /**
     * Get a system setting value, returning the fallback if not found.
     *
     * @param  mixed  $default
     * @return mixed
     */
    public function get(string $key, $default = null);

    /**
     * Get all settings as an associative array.
     *
     * @return array<string, mixed>
     */
    public function getAll(): array;

    /**
     * Update system settings.
     */
    public function update(UpdateSettingsDTO $dto): void;
}

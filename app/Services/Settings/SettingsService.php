<?php

declare(strict_types=1);

namespace App\Services\Settings;

use App\Actions\Settings\GetAllSystemSettingsAction;
use App\Actions\Settings\GetSystemSettingAction;
use App\Actions\Settings\UpdateSystemSettingAction;
use App\Contracts\Services\SettingsServiceInterface;
use App\Domain\Settings\DTOs\UpdateSettingsDTO;

class SettingsService implements SettingsServiceInterface
{
    public function __construct(
        protected GetSystemSettingAction $getAction,
        protected GetAllSystemSettingsAction $getAllAction,
        protected UpdateSystemSettingAction $updateAction
    ) {}

    public function get(string $key, $default = null)
    {
        return $this->getAction->execute($key, $default);
    }

    public function getAll(): array
    {
        $settings = $this->getAllAction->execute();
        $result = [];

        foreach ($settings as $setting) {
            $result[$setting->key] = $setting->value;
        }

        return $result;
    }

    public function update(UpdateSettingsDTO $dto): void
    {
        $this->updateAction->execute($dto);
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Settings;

use App\Domain\Settings\DTOs\UpdateSettingsDTO;
use App\Domain\Settings\Models\SystemSetting;
use Illuminate\Support\Facades\DB;

class UpdateSystemSettingAction
{
    public function execute(UpdateSettingsDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            foreach ($dto->settings as $key => $value) {
                SystemSetting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
        });
    }
}

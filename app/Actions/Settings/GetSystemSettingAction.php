<?php

declare(strict_types=1);

namespace App\Actions\Settings;

use App\Domain\Settings\Models\SystemSetting;

class GetSystemSettingAction
{
    /**
     * @param  mixed  $default
     * @return mixed
     */
    public function execute(string $key, $default = null)
    {
        $setting = SystemSetting::where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return $setting->value;
    }
}

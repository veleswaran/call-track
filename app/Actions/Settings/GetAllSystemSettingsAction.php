<?php

declare(strict_types=1);

namespace App\Actions\Settings;

use App\Domain\Settings\Models\SystemSetting;
use Illuminate\Database\Eloquent\Collection;

class GetAllSystemSettingsAction
{
    /**
     * @return Collection<int, SystemSetting>
     */
    public function execute(): Collection
    {
        return SystemSetting::all();
    }
}

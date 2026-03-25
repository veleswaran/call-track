<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\DeviceStatusData;
use App\Domain\Devices\Models\DeviceStatus;
use Illuminate\Support\Facades\DB;

class CreateDeviceStatusAction
{
    public function execute(DeviceStatusData $data): DeviceStatus
    {
        return DB::transaction(function () use ($data) {
            if ($data->is_default) {
                DeviceStatus::where('is_default', true)->update(['is_default' => false]);
            }

            return DeviceStatus::create([
                'name' => $data->name,
                'color' => $data->color,
                'is_default' => $data->is_default,
                'is_active' => $data->is_active,
            ]);
        });
    }
}

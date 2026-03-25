<?php
declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\DeviceStatusData;
use App\Domain\Devices\Models\DeviceStatus;
use Illuminate\Support\Facades\DB;

class UpdateDeviceStatusAction
{
    public function execute(DeviceStatus $status, DeviceStatusData $data): DeviceStatus
    {
        return DB::transaction(function () use ($status, $data) {
            if ($data->is_default && !$status->is_default) {
                DeviceStatus::where('id', '!=', $status->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }

            $status->update([
                'name' => $data->name,
                'color' => $data->color,
                'is_default' => $data->is_default,
                'is_active' => $data->is_active,
            ]);

            return $status;
        });
    }
}

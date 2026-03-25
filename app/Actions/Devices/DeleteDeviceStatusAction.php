<?php
declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\DeviceStatus;
use Exception;

class DeleteDeviceStatusAction
{
    public function execute(DeviceStatus $status): bool
    {
        if ($status->devices()->exists()) {
            throw new Exception("Cannot delete a status that is assigned to devices. Please reassign the devices first.");
        }
        
        if ($status->is_default) {
            throw new Exception("Cannot delete the default status. Please set another status as default first.");
        }

        return $status->delete();
    }
}

<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Models\DeviceRegistrationCode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListActiveDeviceCodesAction
{
    public function execute(int $perPage = 20): LengthAwarePaginator
    {
        return DeviceRegistrationCode::with('agent')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->paginate($perPage);
    }
}

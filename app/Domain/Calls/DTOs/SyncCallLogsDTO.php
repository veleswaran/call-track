<?php

declare(strict_types=1);

namespace App\Domain\Calls\DTOs;

use App\Domain\Devices\Models\Device;

readonly class SyncCallLogsDTO
{
    /**
     * @param  CallLogData[]  $logs
     */
    public function __construct(
        public Device $device,
        public array $logs,
        public ?int $batteryLevel = null,
    ) {}
}

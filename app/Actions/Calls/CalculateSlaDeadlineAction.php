<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Actions\Settings\GetSystemSettingAction;
use Illuminate\Support\Carbon;

class CalculateSlaDeadlineAction
{
    public function __construct(private readonly GetSystemSettingAction $getSystemSettingAction) {}

    public function execute(Carbon $callTimestamp): Carbon
    {
        $slaHours = (int) $this->getSystemSettingAction->execute('escalation_sla_hours', 2);

        return $callTimestamp->copy()->addHours($slaHours);
    }
}

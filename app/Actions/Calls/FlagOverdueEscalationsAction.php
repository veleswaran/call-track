<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\CallEscalation;
use Illuminate\Support\Carbon;

class FlagOverdueEscalationsAction
{
    public function execute(): int
    {
        return CallEscalation::where('status', 'pending')
            ->where('response_due_at', '<', Carbon::now())
            ->update(['status' => 'unattended']);
    }
}

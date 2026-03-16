<?php

declare(strict_types=1);

namespace App\Jobs\MissedCalls;

use App\Contracts\Services\EscalationServiceContract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AttemptEscalationResolutionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $callLogId) {}

    public function handle(EscalationServiceContract $escalationService): void
    {
        $escalationService->attemptResolutionFromOutgoingCall($this->callLogId);
    }
}

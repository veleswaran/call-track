<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Contracts\Services\EscalationServiceContract;
use Illuminate\Console\Command;

class NotifyUnattendedMissedCallsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'calls:notify-unattended';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send FCM push notifications to devices with unattended missed call escalations';

    /**
     * Execute the console command.
     */
    public function handle(EscalationServiceContract $escalationService): int
    {
        $this->info('Finding unattended missed calls and sending FCM notifications...');

        $sentCount = $escalationService->notifyUnattendedEscalations();

        $this->info("Successfully sent {$sentCount} push notifications for unattended missed calls.");

        return self::SUCCESS;
    }
}

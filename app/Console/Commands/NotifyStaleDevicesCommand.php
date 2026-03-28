<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Contracts\Services\FcmNotificationServiceInterface;
use Illuminate\Console\Command;

class NotifyStaleDevicesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:notify-stale';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send FCM push notifications to devices with a stale heartbeat';

    /**
     * Execute the console command.
     */
    public function handle(FcmNotificationServiceInterface $fcmService): int
    {
        $this->info('Finding stale devices and sending FCM notifications...');

        $sentCount = $fcmService->notifyStaleDevices();

        $this->info("Successfully sent {$sentCount} push notifications.");

        return self::SUCCESS;
    }
}

<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Devices\ArchiveInactiveDevicesAction;
use Illuminate\Console\Command;

class ArchiveInactiveDevicesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:archive-inactive {--days= : The number of days of inactivity before archiving (defaults to device_archive_days setting)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive devices that have been inactive for more than a specified number of days';

    /**
     * Execute the console command.
     */
    public function handle(
        ArchiveInactiveDevicesAction $archiveAction,
        \App\Contracts\Services\SettingsServiceInterface $settingsService
    ): int {
        $daysOption = $this->option('days');

        $days = $daysOption !== null
            ? (int) $daysOption
            : (int) $settingsService->get('device_archive_days', 15);

        $this->info("Archiving devices inactive for more than {$days} days...");

        $archivedCount = $archiveAction->execute($days);

        $this->info("Successfully archived {$archivedCount} inactive devices.");

        return self::SUCCESS;
    }
}

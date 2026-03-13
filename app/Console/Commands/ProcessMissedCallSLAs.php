<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Contracts\Services\EscalationServiceContract;
use Illuminate\Console\Command;

class ProcessMissedCallSLAs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'calls:process-slas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Flag pending call escalations as unattended if they have passed their SLA deadline';

    /**
     * Execute the console command.
     */
    public function handle(EscalationServiceContract $escalationService): void
    {
        $this->info('Processing overdue call escalations...');

        $count = $escalationService->processOverdueSlas();

        $this->info("Successfully flagged {$count} escalations as unattended.");
    }
}

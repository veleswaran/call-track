<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Settings\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Seed the application's default system settings.
     */
    public function run(): void
    {
        $settings = [
            // Filter Visibility Settings
            'enable_call_log_internal_filter' => 1,
            'enable_report_internal_filter' => 1,
            'enable_missed_call_internal_filter' => 1,
            'enable_agent_status_filter' => 1,
            'enable_device_status_filter' => 1,
            'enable_call_log_sim_filter' => 1,
        ];

        foreach ($settings as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}

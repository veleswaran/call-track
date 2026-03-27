<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The migrations that should be run before this migration.
     *
     * @return array
     */
    public function after(): array
    {
        return [
            '2026_03_06_163138_create_system_settings_table',
        ];
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();
        $keys = [
            'enable_call_log_agent_filter',
            'enable_missed_call_agent_filter',
            'enable_report_agent_filter',
            'enable_call_log_team_filter',
            'enable_missed_call_team_filter',
            'enable_report_team_filter',
            'enable_call_log_class_filter',
            'enable_report_class_filter',
            'enable_call_log_outcome_filter',
            'enable_report_outcome_filter',
            'enable_call_log_internal_filter',
            'enable_missed_call_internal_filter',
            'enable_report_internal_filter',
            'enable_agent_status_filter',
            'enable_device_status_filter',
            'enable_call_log_sim_filter',
        ];

        foreach ($keys as $key) {
            DB::table('system_settings')->updateOrInsert(
                ['key' => $key],
                [
                    'value' => json_encode(true),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to remove these in down as they are harmless settings
    }

};
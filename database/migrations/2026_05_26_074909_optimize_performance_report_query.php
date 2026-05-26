<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX idx_call_logs_timestamp ON call_logs(timestamp);');
        DB::statement('CREATE INDEX idx_call_logs_device_timestamp ON call_logs(device_id, timestamp);');
        DB::statement('CREATE INDEX idx_devices_agent_id ON devices(agent_id);');
        DB::statement('CREATE INDEX idx_call_classifications_type ON call_classifications(type);');
        DB::statement('CREATE INDEX idx_call_classifications_call_type ON call_classifications(call_log_id, type);');
        DB::statement('CREATE INDEX idx_call_logs_phone_hash ON call_logs(phone_number_hash);');
        DB::statement('CREATE INDEX idx_call_logs_outcome ON call_logs(direction, duration);');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_call_logs_timestamp;');
        DB::statement('DROP INDEX IF EXISTS idx_call_logs_device_timestamp;');
        DB::statement('DROP INDEX IF EXISTS idx_devices_agent_id;');
        DB::statement('DROP INDEX IF EXISTS idx_call_classifications_type;');
        DB::statement('DROP INDEX IF EXISTS idx_call_classifications_call_type;');
        DB::statement('DROP INDEX IF EXISTS idx_call_logs_phone_hash;');
        DB::statement('DROP INDEX IF EXISTS idx_call_logs_outcome;');
    }
};

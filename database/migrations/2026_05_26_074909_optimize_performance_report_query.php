<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds critical indexes to optimize the performance report query.
     * Expected improvement: 1.4-6.7x faster queries depending on dataset size.
     */
    public function up(): void
    {
        // Index on call_logs.timestamp for date range filtering
        Schema::table('call_logs', function (Blueprint $table) {
            $table->index('timestamp', 'idx_call_logs_timestamp');
        });

        // Composite index on call_logs(device_id, timestamp) for optimized joins + date filtering
        Schema::table('call_logs', function (Blueprint $table) {
            $table->index(['device_id', 'timestamp'], 'idx_call_logs_device_timestamp');
        });

        // Index on devices.agent_id for agent-device joins
        Schema::table('devices', function (Blueprint $table) {
            $table->index('agent_id', 'idx_devices_agent_id');
        });

        // Index on call_classifications.type for BUSINESS/PERSONAL filtering
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->index('type', 'idx_call_classifications_type');
        });

        // Composite index on call_classifications(call_log_id, type) for covering index
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->index(['call_log_id', 'type'], 'idx_call_classifications_call_type');
        });

        // Index on call_logs.phone_number_hash for contact filtering
        Schema::table('call_logs', function (Blueprint $table) {
            $table->index('phone_number_hash', 'idx_call_logs_phone_hash');
        });

        // Composite index on call_logs(direction, duration) for outcome calculations
        Schema::table('call_logs', function (Blueprint $table) {
            $table->index(['direction', 'duration'], 'idx_call_logs_outcome');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_logs', function (Blueprint $table) {
            $table->dropIndex('idx_call_logs_timestamp');
            $table->dropIndex('idx_call_logs_device_timestamp');
            $table->dropIndex('idx_call_logs_phone_hash');
            $table->dropIndex('idx_call_logs_outcome');
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->dropIndex('idx_devices_agent_id');
        });

        Schema::table('call_classifications', function (Blueprint $table) {
            $table->dropIndex('idx_call_classifications_type');
            $table->dropIndex('idx_call_classifications_call_type');
        });
    }
};

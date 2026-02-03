<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add agent_id to call_logs to permanently capture the agent at ingestion time
        Schema::table('call_logs', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable()->after('device_id')->constrained('agents')->nullOnDelete();
            $table->index('agent_id');
        });

        // Backfill existing call_logs with current device agent
        \Illuminate\Support\Facades\DB::statement('
            UPDATE call_logs
            SET agent_id = (
                SELECT devices.agent_id
                FROM devices
                WHERE devices.id = call_logs.device_id
            )
        ');

        // Remove agent_id from call_classifications (redundant, we have user_id for admin classification)
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
            $table->dropColumn('agent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable()->after('user_id')->constrained('agents')->nullOnDelete();
        });

        Schema::table('call_logs', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
            $table->dropIndex(['agent_id']);
            $table->dropColumn('agent_id');
        });
    }
};

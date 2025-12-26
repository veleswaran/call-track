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
        Schema::table('call_logs', function (Blueprint $table) {
            // phone_number will be encrypted by Eloquent casts, but stored as text/string
            // We use text to accommodate encrypted length. Nullable for existing records.
            $table->text('phone_number')->nullable()->after('device_id');
            $table->integer('sim_slot')->default(0)->after('direction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_logs', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'sim_slot']);
        });
    }
};

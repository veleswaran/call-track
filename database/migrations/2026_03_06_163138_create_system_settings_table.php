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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });

        // Insert initial system settings
        DB::table('system_settings')->insert([
            [
                'key' => 'fcm_stale_title',
                'value' => json_encode('CallTrack needs your attention'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'fcm_stale_body',
                'value' => json_encode('Your device is going into sleep mode. Tap here to keep call tracking active.'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'heartbeat_threshold_minutes',
                'value' => json_encode(60),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};

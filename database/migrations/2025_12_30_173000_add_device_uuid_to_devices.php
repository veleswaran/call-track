<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->uuid('device_uuid')->nullable()->after('id');
        });

        // Generate UUIDs for existing devices
        DB::table('devices')->whereNull('device_uuid')->orderBy('id')->each(function ($device) {
            DB::table('devices')
                ->where('id', $device->id)
                ->update(['device_uuid' => (string) Str::uuid()]);
        });

        // Now make it required and unique
        Schema::table('devices', function (Blueprint $table) {
            $table->uuid('device_uuid')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropUnique(['device_uuid']);
            $table->dropColumn('device_uuid');
        });
    }
};

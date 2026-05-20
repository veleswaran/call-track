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
        Schema::table('devices', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->index();
        });

        // Migrate existing archived devices
        \Illuminate\Support\Facades\DB::table('devices')
            ->where('status', 'archived')
            ->update([
                'is_archived' => true,
                'status' => 'inactive',
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::table('devices')
            ->where('is_archived', true)
            ->update([
                'status' => 'archived',
            ]);

        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn('is_archived');
        });
    }
};

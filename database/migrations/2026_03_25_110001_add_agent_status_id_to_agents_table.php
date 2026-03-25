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
        Schema::table('agents', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->foreignId('agent_status_id')->nullable()->constrained('agent_statuses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->dropForeign(['agent_status_id']);
            $table->dropColumn('agent_status_id');
            $table->string('status')->default('active');
        });
    }
};

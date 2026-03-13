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
        Schema::create('call_escalations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_log_id')->unique()->constrained('call_logs')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, unattended, resolved
            $table->timestamp('response_due_at');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by_call_id')->nullable()->constrained('call_logs')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_escalations');
    }
};

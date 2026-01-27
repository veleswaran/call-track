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
        Schema::create('device_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('event_type');
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            // Idempotency: prevent duplicate events for same device + event + timestamp
            $table->unique(['device_id', 'event_type', 'occurred_at'], 'device_events_idempotent');
            $table->index(['device_id', 'event_type']);
            $table->index('occurred_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_events');
    }
};

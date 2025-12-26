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
        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('call_hash')->comment('Unique hash of call details');
            $table->string('phone_number_hash');
            $table->string('direction'); // INCOMING, OUTGOING, MISSED
            $table->integer('duration')->default(0); // seconds
            $table->timestamp('timestamp'); // when call happened
            $table->timestamp('created_at')->useCurrent();
            
            $table->unique(['device_id', 'call_hash']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_logs');
    }
};

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
        Schema::create('analytics_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('device_id')->constrained()->cascadeOnDelete(); 
            $table->integer('total_calls')->default(0);
            $table->integer('total_duration')->default(0);
            $table->integer('business_calls')->default(0);
            $table->integer('personal_calls')->default(0);
            $table->integer('ignored_calls')->default(0);
            $table->timestamps();
            
            $table->unique(['date', 'device_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics_daily');
    }
};

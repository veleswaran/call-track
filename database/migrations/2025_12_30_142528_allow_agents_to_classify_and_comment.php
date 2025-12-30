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
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('agent_id')->nullable()->after('user_id')->constrained('agents')->cascadeOnDelete();
        });

        Schema::table('call_notes', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('agent_id')->nullable()->after('user_id')->constrained('agents')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('call_notes', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
            $table->dropColumn('agent_id');
        });

        Schema::table('call_classifications', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
            $table->dropColumn('agent_id');
        });
    }
};

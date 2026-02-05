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
        // Add note and metadata columns to call_classifications
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->text('note')->nullable()->after('type');
            $table->json('metadata')->nullable()->after('note');
        });

        // Remove reason column from call_classifications
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->dropColumn('reason');
        });

        // Drop call_notes table (no data migration needed - app not live)
        Schema::dropIfExists('call_notes');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate call_notes table
        Schema::create('call_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_log_id')->constrained('call_logs')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->text('note');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Re-add reason column and remove note/metadata
        Schema::table('call_classifications', function (Blueprint $table) {
            $table->text('reason')->nullable()->after('type');
        });

        Schema::table('call_classifications', function (Blueprint $table) {
            $table->dropColumn(['note', 'metadata']);
        });
    }
};

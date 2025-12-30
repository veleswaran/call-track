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
        Schema::table('contacts', function (Blueprint $table) {
            // Drop the existing unique constraint
            $table->dropUnique(['device_id', 'phone_hash']);

            // Drop the foreign key and column
            $table->dropForeign(['device_id']);
            $table->dropColumn('device_id');

            // Add new unique constraint on phone_hash globally
            $table->unique('phone_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            // Remove global unique constraint
            $table->dropUnique(['phone_hash']);

            // Re-add device_id column
            $table->foreignId('device_id')->after('id')->constrained()->cascadeOnDelete();

            // Re-add composite unique constraint
            $table->unique(['device_id', 'phone_hash']);
        });
    }
};

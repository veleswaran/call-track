<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('device_tokens', function (Blueprint $table) {
            // Rename token to token_hash
            $table->renameColumn('token', 'token_hash');
        });

        Schema::table('device_tokens', function (Blueprint $table) {
            // Add lifecycle columns
            $table->timestamp('issued_at')->nullable()->after('token_hash');
            $table->timestamp('expires_at')->nullable()->after('issued_at');
            $table->timestamp('revoked_at')->nullable()->after('expires_at');
        });

        // Set issued_at for existing tokens (use created_at as fallback)
        DB::table('device_tokens')
            ->whereNull('issued_at')
            ->update(['issued_at' => DB::raw('created_at')]);

        // Make issued_at required
        Schema::table('device_tokens', function (Blueprint $table) {
            $table->timestamp('issued_at')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('device_tokens', function (Blueprint $table) {
            $table->dropColumn(['issued_at', 'expires_at', 'revoked_at']);
        });

        Schema::table('device_tokens', function (Blueprint $table) {
            $table->renameColumn('token_hash', 'token');
        });
    }
};

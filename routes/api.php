<?php

use App\Http\Controllers\Api\Admin\CallClassificationController;
use App\Http\Middleware\DeviceAuthMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // Device Routes
    Route::post('/devices/register', [\App\Http\Controllers\Api\DeviceRegistrationController::class, 'store']); // Open Registration

    Route::middleware([DeviceAuthMiddleware::class])->group(function () {
        Route::post('/call-logs/sync', [\App\Http\Controllers\Api\CallLogController::class, 'store']);
        Route::post('/call-logs/{callHash}/classify', [\App\Http\Controllers\Api\DeviceCallClassificationController::class, 'classify']);
        Route::post('/devices/sync', [\App\Http\Controllers\Api\CallLogController::class, 'store']);
    });

    // Admin Routes
    Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'index']);
        Route::get('/dashboard/charts', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'charts']);

        // Device Codes
        Route::post('/devices/codes', [\App\Http\Controllers\Api\Admin\DeviceCodeController::class, 'store']);
        Route::get('/devices/codes', [\App\Http\Controllers\Api\Admin\DeviceCodeController::class, 'index']);

        Route::post('/calls/{id}/classify', [CallClassificationController::class, 'store']);

        // Agent Management
        Route::apiResource('agents', \App\Http\Controllers\Api\Admin\AgentController::class);
        Route::post('/devices/{device}/assign-agent', [\App\Http\Controllers\Api\Admin\DeviceAgentController::class, 'assign']);
        Route::post('/devices/{device}/unassign-agent', [\App\Http\Controllers\Api\Admin\DeviceAgentController::class, 'unassign']);

        // Devices
        Route::get('/devices', [\App\Http\Controllers\Api\Admin\DeviceController::class, 'index']);
        Route::post('/devices/{device}/revoke-tokens', \App\Http\Controllers\Api\Admin\RevokeDeviceTokensController::class);

        // Call Logs
        Route::get('/call-logs', [\App\Http\Controllers\Api\Admin\CallLogController::class, 'index']);

        // Contacts
        Route::post('/contacts', [\App\Http\Controllers\Api\Admin\ContactController::class, 'store']);
        Route::get('/contacts', [\App\Http\Controllers\Api\Admin\ContactController::class, 'index']);

        // User Management
        Route::apiResource('users', \App\Http\Controllers\Api\Admin\AdminUserController::class);
        Route::post('/users/{id}/reset-2fa', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'resetTwoFactor']);

        // 2FA Management (Session based)
        Route::middleware(['web', 'auth:sanctum'])->group(function () {
            Route::post('/auth/two-factor/enable', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'enable']);
            Route::post('/auth/two-factor/confirm', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'confirm']);
            Route::post('/auth/two-factor/disable', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'disable']);
            Route::post('/auth/two-factor/recovery-codes', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'recoveryCodes']);
        });
    });

    // 2FA Challenge (Public/Guest because standard login is public, but accessing session)
    Route::middleware(['web'])->post('/auth/two-factor/challenge', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'challenge']);
});

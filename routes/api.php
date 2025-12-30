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
    });
});

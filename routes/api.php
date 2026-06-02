<?php

use App\Http\Controllers\Api\Admin\CallClassificationController;
use App\Http\Controllers\Api\V1\BrandingController;
use App\Http\Middleware\DeviceAuthMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return new \App\Http\Resources\AdminUserResource($request->user());
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // Public Branding
    Route::get('/branding', [BrandingController::class, 'index']);
    Route::post('/auth/login', [\App\Http\Controllers\Api\Auth\AdminTokenAuthController::class, 'login']);

    // Device Routes
    Route::post('/devices/register', [\App\Http\Controllers\Api\DeviceRegistrationController::class, 'store'])->name('devices.register'); // Open Registration

    Route::middleware([DeviceAuthMiddleware::class])->group(function () {
        Route::post('/call-logs/sync', [\App\Http\Controllers\Api\CallLogController::class, 'store']);
        Route::post('/call-logs/{callHash}/classify', [\App\Http\Controllers\Api\DeviceCallClassificationController::class, 'classify']);
        Route::post('/device/events', [\App\Http\Controllers\Api\Device\DeviceEventController::class, 'store']);
        Route::post('/device/fcm-token', [\App\Http\Controllers\Api\DeviceFcmTokenController::class, 'store']);
    });

    // Admin Routes
    Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'index']);
        Route::get('/dashboard/charts', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'charts']);

        Route::prefix('reports')->group(function () {
            Route::get('/metrics', [\App\Http\Controllers\Api\Admin\ReportController::class, 'metrics']);
            Route::get('/charts', [\App\Http\Controllers\Api\Admin\ReportController::class, 'charts']);
            Route::get('/performance', [\App\Http\Controllers\Api\Admin\ReportController::class, 'performance']);
            Route::get('/day-wise', [\App\Http\Controllers\Api\Admin\ReportController::class, 'dayWise']);
        });

        // Device Codes
        Route::post('/devices/codes', [\App\Http\Controllers\Api\Admin\DeviceCodeController::class, 'store']);
        Route::get('/devices/codes', [\App\Http\Controllers\Api\Admin\DeviceCodeController::class, 'index']);

        Route::post('/calls/{id}/classify', [CallClassificationController::class, 'store']);

        // Agent Management
        Route::apiResource('agents', \App\Http\Controllers\Api\Admin\AgentController::class);
        Route::post('/agents/{agent}/link-user', \App\Http\Controllers\Api\Admin\LinkUserToAgentController::class);
        Route::post('/agents/{agent}/unlink-user', \App\Http\Controllers\Api\Admin\UnlinkUserFromAgentController::class);
        Route::post('/devices/{device}/assign-agent', [\App\Http\Controllers\Api\Admin\DeviceAgentController::class, 'assign']);
        Route::post('/devices/{device}/unassign-agent', [\App\Http\Controllers\Api\Admin\DeviceAgentController::class, 'unassign']);

        // Devices
        Route::get('/devices', [\App\Http\Controllers\Api\Admin\DeviceController::class, 'index']);
        Route::get('/devices/{device}/events', [\App\Http\Controllers\Api\Admin\DeviceEventController::class, 'index']);
        Route::post('/devices/{device}/revoke-tokens', \App\Http\Controllers\Api\Admin\RevokeDeviceTokensController::class);

        // Call Logs
        Route::get('/call-logs', [\App\Http\Controllers\Api\Admin\CallLogController::class, 'index']);
        Route::get('/call-logs/escalations', [\App\Http\Controllers\Api\V1\EscalationInsightController::class, 'index']);

        // Contacts
        Route::post('/contacts', [\App\Http\Controllers\Api\Admin\ContactController::class, 'store']);
        Route::get('/contacts', [\App\Http\Controllers\Api\Admin\ContactController::class, 'index']);
        Route::put('/contacts/{id}', [\App\Http\Controllers\Api\Admin\ContactController::class, 'update']);
        Route::delete('/contacts/{id}', [\App\Http\Controllers\Api\Admin\ContactController::class, 'destroy']);

        // User Management
        Route::apiResource('users', \App\Http\Controllers\Api\Admin\AdminUserController::class);
        Route::put('/users/{id}/role', [\App\Http\Controllers\Api\Admin\UserRoleController::class, 'update']);
        Route::post('/users/{id}/reset-2fa', [\App\Http\Controllers\Api\Admin\AdminUserController::class, 'resetTwoFactor']);

        // Team Management
        Route::get('teams', [\App\Http\Controllers\Api\Teams\TeamController::class, 'index']);
        Route::post('teams', [\App\Http\Controllers\Api\Teams\TeamController::class, 'store']);
        Route::get('teams/{team}', [\App\Http\Controllers\Api\Teams\TeamController::class, 'show']);
        Route::patch('teams/{team}', [\App\Http\Controllers\Api\Teams\TeamController::class, 'update']);
        Route::delete('teams/{team}', [\App\Http\Controllers\Api\Teams\TeamController::class, 'destroy']);
        Route::post('teams/{team}/members', [\App\Http\Controllers\Api\Teams\TeamController::class, 'addMember']);
        Route::delete('teams/{team}/members/{agent}', [\App\Http\Controllers\Api\Teams\TeamController::class, 'removeMember']);
        Route::patch('teams/{team}/members/{agent}', [\App\Http\Controllers\Api\Teams\TeamController::class, 'updateMemberRole']);

        // System Settings
        Route::get('/settings', [\App\Http\Controllers\Api\Admin\SystemSettingsController::class, 'index']);
        Route::post('/settings', [\App\Http\Controllers\Api\Admin\SystemSettingsController::class, 'store']);
        Route::post('/settings/logo', [\App\Http\Controllers\Api\Admin\BrandingLogoController::class, 'store']);

        // Manual Push Notifications
        Route::post('/devices/{device}/push', [\App\Http\Controllers\Api\Admin\DevicePushNotificationController::class, 'store']);
    });

    // 2FA Management (Session based)
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/auth/logout', [\App\Http\Controllers\Api\Auth\AdminTokenAuthController::class, 'logout']);
        Route::post('/profile/password', [\App\Http\Controllers\Api\ProfileController::class, 'updatePassword']);

        Route::post('/auth/two-factor/enable', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'enable']);
        Route::post('/auth/two-factor/confirm', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'confirm']);
        Route::post('/auth/two-factor/disable', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'disable']);
        Route::post('/auth/two-factor/recovery-codes', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'recoveryCodes']);
    });

    // 2FA Challenge (Public/Guest because standard login is public, but accessing session)
    Route::post('/auth/two-factor/challenge', [\App\Http\Controllers\Api\Auth\TwoFactorController::class, 'challenge']);
});

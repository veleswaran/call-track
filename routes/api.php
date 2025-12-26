<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CallLogController;
use App\Http\Controllers\Api\Admin\CallClassificationController;
use App\Http\Middleware\DeviceAuthMiddleware;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    // Device Routes
    Route::middleware([DeviceAuthMiddleware::class])->group(function () {
        Route::post('/call-logs/bulk', [CallLogController::class, 'store']);
    });

    // Admin Routes
    Route::prefix('admin')->middleware(['auth:sanctum'])->group(function () {
        Route::post('/calls/{id}/classify', [CallClassificationController::class, 'store']);
    });
});

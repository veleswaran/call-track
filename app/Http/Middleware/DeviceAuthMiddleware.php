<?php

namespace App\Http\Middleware;

use App\Contracts\Services\DeviceTokenServiceInterface;
use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DeviceAuthMiddleware
{
    public function __construct(
        protected DeviceTokenServiceInterface $tokenService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Device-Token');

        if (! $token) {
            return response()->json([
                'message' => 'Device Token Missing',
                'error_code' => DeviceTokenValidationResult::ERROR_MISSING,
            ], 401);
        }

        $result = $this->tokenService->validateToken($token);

        if (! $result->isValid) {
            return response()->json([
                'message' => 'Invalid Device Token',
                'error_code' => $result->errorCode,
            ], 401);
        }

        // Get the device model (optimization: could be cached or loaded via service)
        $device = \App\Domain\Devices\Models\Device::find($result->deviceId);

        $request->attributes->set('device', $device);

        return $next($request);
    }
}

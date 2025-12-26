<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DeviceAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Device-Token');

        if (! $token) {
            return response()->json(['message' => 'Device Token Missing'], 401);
        }

        $deviceToken = \App\Domain\Devices\Models\DeviceToken::with('device')
            ->where('token', $token)
            ->first();

        if (! $deviceToken) {
            return response()->json(['message' => 'Invalid Device Token'], 401);
        }

        $deviceToken->forceFill(['last_used_at' => now()])->save();

        $request->attributes->set('device', $deviceToken->device);

        return $next($request);
    }
}

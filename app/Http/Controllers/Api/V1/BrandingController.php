<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\SettingsServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BrandingController extends Controller
{
    public function __construct(
        protected SettingsServiceInterface $settingsService
    ) {}

    /**
     * Get public branding configuration.
     *
     * This endpoint provides basic site information (like the site name)
     * without requiring authentication, allowing layouts and login pages
     * to show the correct branding.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'app_sitename' => $this->settingsService->get('app_sitename', 'CallTrack AI Admin'),
        ]);
    }
}

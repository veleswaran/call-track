<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\SettingsServiceInterface;
use App\Domain\Settings\DTOs\UpdateSettingsDTO;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    public function __construct(
        protected SettingsServiceInterface $settingsService
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->settingsService->getAll(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $dto = new UpdateSettingsDTO($validated['settings']);

        $this->settingsService->update($dto);

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\SettingsServiceInterface;
use App\Domain\Settings\DTOs\UpdateSettingsDTO;
use App\Domain\Settings\Models\SystemSetting;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemSettingsRequest;
use Illuminate\Http\JsonResponse;

class SystemSettingsController extends Controller
{
    public function __construct(
        protected SettingsServiceInterface $settingsService
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', SystemSetting::class);

        return response()->json([
            'data' => $this->settingsService->getAll(),
        ]);
    }

    public function store(UpdateSystemSettingsRequest $request): JsonResponse
    {
        $dto = new UpdateSettingsDTO($request->validated('settings'));

        $this->settingsService->update($dto);

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }
}

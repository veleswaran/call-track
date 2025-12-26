<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Calls\Models\CallLog;
use App\Http\Controllers\Controller;
use App\Http\Resources\CallLogResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CallLogController extends Controller
{
    /**
     * List all call logs
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = CallLog::query()->with('classification')->latest();

        $callLogs = $query->paginate($request->input('per_page', 15));

        return CallLogResource::collection($callLogs);
    }
}

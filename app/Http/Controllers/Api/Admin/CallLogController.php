<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\CallLogQueryServiceContract;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexCallLogsRequest;
use App\Http\Resources\CallLogResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CallLogController extends Controller
{
    public function __construct(
        private readonly CallLogQueryServiceContract $service,
    ) {}

    /**
     * List all call logs
     */
    public function index(IndexCallLogsRequest $request): AnonymousResourceCollection
    {
        $dto = ListCallLogsDTO::fromRequest($request);

        $paginator = $this->service->list($dto);

        return CallLogResource::collection($paginator);
    }
}

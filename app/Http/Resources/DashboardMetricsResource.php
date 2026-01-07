<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Dashboard\DTOs\DashboardMetricsDTO;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * API Resource for dashboard metrics
 *
 * @mixin DashboardMetricsDTO
 */
final class DashboardMetricsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var DashboardMetricsDTO $metrics */
        $metrics = $this->resource;

        return [
            'total_calls' => $metrics->total_calls,
            'business_calls' => $metrics->business_calls,
            'personal_calls' => $metrics->personal_calls,
            'ignored_calls' => $metrics->ignored_calls,
            'unclassified_calls' => $metrics->unclassified_calls,
            'total_devices' => $metrics->total_devices,
            'active_devices' => $metrics->active_devices,
            'missed_calls' => $metrics->missed_calls,
            'total_agents' => $metrics->total_agents,
            'total_duration_seconds' => $metrics->total_duration_seconds,
            'average_call_duration_seconds' => round($metrics->average_call_duration_seconds, 2),
            // Week-over-week comparison
            'total_calls_change_percent' => $metrics->total_calls_change_percent,
            'missed_calls_change_percent' => $metrics->missed_calls_change_percent,
            'average_call_duration_change_percent' => $metrics->average_call_duration_change_percent,
            'total_duration_change_percent' => $metrics->total_duration_change_percent,
        ];
    }
}

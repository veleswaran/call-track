<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\DTOs;

/**
 * Data Transfer Object for dashboard metrics
 */
final readonly class DashboardMetricsDTO
{
    public function __construct(
        public int $total_calls,
        public int $business_calls,
        public int $personal_calls,
        public int $ignored_calls,
        public int $unclassified_calls,
        public int $total_devices,
        public int $active_devices,
        public int $total_agents,
        public int $total_duration_seconds,
        public float $average_call_duration_seconds,
    ) {}

    /**
     * Create from array of aggregated data
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            total_calls: (int) ($data['total_calls'] ?? 0),
            business_calls: (int) ($data['business_calls'] ?? 0),
            personal_calls: (int) ($data['personal_calls'] ?? 0),
            ignored_calls: (int) ($data['ignored_calls'] ?? 0),
            unclassified_calls: (int) ($data['unclassified_calls'] ?? 0),
            total_devices: (int) ($data['total_devices'] ?? 0),
            active_devices: (int) ($data['active_devices'] ?? 0),
            total_agents: (int) ($data['total_agents'] ?? 0),
            total_duration_seconds: (int) ($data['total_duration_seconds'] ?? 0),
            average_call_duration_seconds: (float) ($data['average_call_duration_seconds'] ?? 0),
        );
    }

    /**
     * Convert to array for API response
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'total_calls' => $this->total_calls,
            'business_calls' => $this->business_calls,
            'personal_calls' => $this->personal_calls,
            'ignored_calls' => $this->ignored_calls,
            'unclassified_calls' => $this->unclassified_calls,
            'total_devices' => $this->total_devices,
            'active_devices' => $this->active_devices,
            'total_agents' => $this->total_agents,
            'total_duration_seconds' => $this->total_duration_seconds,
            'average_call_duration_seconds' => $this->average_call_duration_seconds,
        ];
    }
}

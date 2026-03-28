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
        public int $missed_calls,
        public int $total_missed_calls,
        public int $total_agents,
        public int $total_duration_seconds,
        public float $average_call_duration_seconds,
        public int $pending_escalations,
        public int $unattended_escalations,
        public int $resolved_escalations,
        // Week-over-week comparison percentages
        public ?float $total_calls_change_percent = null,
        public ?float $missed_calls_change_percent = null,
        public ?float $average_call_duration_change_percent = null,
        public ?float $total_duration_change_percent = null,
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
            missed_calls: (int) ($data['missed_calls'] ?? 0),
            total_missed_calls: (int) ($data['total_missed_calls'] ?? 0),
            total_agents: (int) ($data['total_agents'] ?? 0),
            total_duration_seconds: (int) ($data['total_duration_seconds'] ?? 0),
            average_call_duration_seconds: (float) ($data['average_call_duration_seconds'] ?? 0),
            pending_escalations: (int) ($data['pending_escalations'] ?? 0),
            unattended_escalations: (int) ($data['unattended_escalations'] ?? 0),
            resolved_escalations: (int) ($data['resolved_escalations'] ?? 0),
            total_calls_change_percent: isset($data['total_calls_change_percent']) ? (float) $data['total_calls_change_percent'] : null,
            missed_calls_change_percent: isset($data['missed_calls_change_percent']) ? (float) $data['missed_calls_change_percent'] : null,
            average_call_duration_change_percent: isset($data['average_call_duration_change_percent']) ? (float) $data['average_call_duration_change_percent'] : null,
            total_duration_change_percent: isset($data['total_duration_change_percent']) ? (float) $data['total_duration_change_percent'] : null,
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
            'missed_calls' => $this->missed_calls,
            'total_missed_calls' => $this->total_missed_calls,
            'total_agents' => $this->total_agents,
            'total_duration_seconds' => $this->total_duration_seconds,
            'average_call_duration_seconds' => $this->average_call_duration_seconds,
            'pending_escalations' => $this->pending_escalations,
            'unattended_escalations' => $this->unattended_escalations,
            'resolved_escalations' => $this->resolved_escalations,
            'total_calls_change_percent' => $this->total_calls_change_percent,
            'missed_calls_change_percent' => $this->missed_calls_change_percent,
            'average_call_duration_change_percent' => $this->average_call_duration_change_percent,
            'total_duration_change_percent' => $this->total_duration_change_percent,
        ];
    }
}

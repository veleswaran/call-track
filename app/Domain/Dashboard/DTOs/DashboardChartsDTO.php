<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\DTOs;

/**
 * Data Transfer Object for dashboard chart data
 */
final readonly class DashboardChartsDTO
{
    /**
     * @param  array<int, array{day: string, current: int, previous: int}>  $volume_trends
     * @param  array<int, array{name: string, value: int}>  $outcome_distribution
     */
    public function __construct(
        public array $volume_trends,
        public array $outcome_distribution,
    ) {}

    /**
     * Create from arrays
     *
     * @param  array<int, array{day: string, current: int, previous: int}>  $volumeTrends
     * @param  array<int, array{name: string, value: int}>  $outcomeDistribution
     */
    public static function from(array $volumeTrends, array $outcomeDistribution): self
    {
        return new self(
            volume_trends: $volumeTrends,
            outcome_distribution: $outcomeDistribution,
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
            'volume_trends' => $this->volume_trends,
            'outcome_distribution' => $this->outcome_distribution,
        ];
    }
}

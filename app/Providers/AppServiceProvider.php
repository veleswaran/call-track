<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \App\Contracts\Services\CallSyncServiceInterface::class,
            \App\Services\Calls\CallSyncService::class
        );

        $this->app->bind(
            \App\Contracts\Services\CallGovernanceServiceInterface::class,
            \App\Services\Governance\CallGovernanceService::class
        );

        $this->app->bind(
            \App\Contracts\Services\AgentManagementServiceInterface::class,
            \App\Services\Agents\AgentManagementService::class
        );

        $this->app->bind(
            \App\Contracts\Services\DeviceRegistrationServiceInterface::class,
            \App\Services\Devices\DeviceRegistrationService::class
        );

        $this->app->bind(
            \App\Contracts\Services\DashboardServiceContract::class,
            \App\Services\DashboardService::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::define('viewApiDocs', function (?\App\Domain\Users\Models\User $user) {
            return true; // Simplistic for now. Restrict in production.
        });
    }
}

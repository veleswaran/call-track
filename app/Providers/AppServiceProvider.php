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
            \App\Contracts\Services\CallLogQueryServiceContract::class,
            \App\Services\CallLogQueryService::class
        );

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

        $this->app->bind(
            \App\Contracts\Services\ContactManagementServiceInterface::class,
            \App\Services\Contacts\ContactManagementService::class
        );

        $this->app->bind(
            \App\Contracts\Services\CallNoteServiceInterface::class,
            \App\Services\Calls\CallNoteService::class
        );

        $this->app->bind(
            \App\Contracts\Services\DeviceTokenServiceInterface::class,
            \App\Services\Devices\DeviceTokenService::class
        );

        $this->app->bind(
            \App\Contracts\Services\UserManagementServiceInterface::class,
            \App\Services\Users\UserManagementService::class
        );

        $this->app->bind(
            \App\Contracts\Services\TwoFactorServiceInterface::class,
            \App\Services\Auth\TwoFactorService::class
        );

        $this->app->bind(
            \App\Contracts\Services\AuthServiceInterface::class,
            \App\Services\Auth\AuthService::class
        );

        $this->app->bind(
            \App\Contracts\Services\DeviceCodeServiceInterface::class,
            \App\Services\Devices\DeviceCodeService::class
        );

        $this->app->bind(
            \App\Contracts\Services\ReportServiceInterface::class,
            \App\Services\ReportService::class
        );

        $this->app->bind(
            \App\Contracts\Services\TeamServiceInterface::class,
            \App\Services\Teams\TeamService::class
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

        \Illuminate\Support\Facades\Gate::policy(\App\Domain\Teams\Models\Team::class, \App\Policies\TeamPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Domain\Agents\Models\Agent::class, \App\Policies\AgentPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Domain\Calls\Models\CallLog::class, \App\Policies\CallLogPolicy::class);
    }
}

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}

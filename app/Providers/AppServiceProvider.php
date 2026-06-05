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
        $this->app->singleton(\Kreait\Firebase\Contract\Messaging::class, function ($app) {
            $path = config('firebase.credentials_path');

            if ($path && file_exists($path)) {
                $factory = (new \Kreait\Firebase\Factory)
                    ->withServiceAccount($path);

                return $factory->createMessaging();
            }

            if (class_exists(\Tests\Fakes\FakeMessaging::class)) {
                return new \Tests\Fakes\FakeMessaging;
            }

            throw new \RuntimeException('Firebase credentials are not configured and FakeMessaging is only available in development/testing environments.');
        });

        $this->app->bind(
            \App\Contracts\Services\CallLogQueryServiceContract::class,
            \App\Services\CallLogQueryService::class
        );

        $this->app->bind(
            \App\Contracts\Services\CallLogExportServiceContract::class,
            \App\Services\CallLogExportService::class
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
            \App\Contracts\Services\DeviceManagementServiceInterface::class,
            \App\Services\Devices\DeviceManagementService::class
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
            \App\Contracts\Services\TokenAuthServiceInterface::class,
            \App\Services\Auth\TokenAuthService::class
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
            \App\Contracts\Services\Teams\TeamManagementServiceInterface::class,
            \App\Services\Teams\TeamManagementService::class
        );
        $this->app->bind(
            \App\Contracts\Services\Teams\TeamMemberServiceInterface::class,
            \App\Services\Teams\TeamMemberService::class
        );
        $this->app->bind(
            \App\Contracts\Services\Teams\TeamQueryServiceInterface::class,
            \App\Services\Teams\TeamQueryService::class
        );

        $this->app->bind(
            \App\Contracts\Services\DeviceEventServiceInterface::class,
            \App\Services\Devices\DeviceEventService::class
        );

        $this->app->bind(
            \App\Contracts\Services\Users\UserRoleServiceInterface::class,
            \App\Services\Users\UserRoleService::class
        );

        $this->app->bind(
            \App\Contracts\Services\SettingsServiceInterface::class,
            \App\Services\Settings\SettingsService::class
        );

        $this->app->bind(
            \App\Contracts\Services\FcmNotificationServiceInterface::class,
            \App\Services\Devices\FcmNotificationService::class
        );

        $this->app->bind(
            \App\Contracts\Services\EscalationServiceContract::class,
            \App\Services\EscalationService::class
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
        \Illuminate\Support\Facades\Gate::policy(\App\Domain\Settings\Models\SystemSetting::class, \App\Policies\SystemSettingPolicy::class);

    }
}

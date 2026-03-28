<?php

declare(strict_types=1);

namespace Tests\Feature\Actions\Settings;

use App\Actions\Settings\GetSystemSettingAction;
use App\Domain\Settings\Models\SystemSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GetSystemSettingActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_gets_system_setting(): void
    {
        SystemSetting::create(['key' => 'test_key', 'value' => 'test_value']);

        $action = new GetSystemSettingAction;
        $result = $action->execute('test_key');

        $this->assertEquals('test_value', $result);
    }

    public function test_it_returns_default_if_setting_not_found(): void
    {
        $action = new GetSystemSettingAction;
        $result = $action->execute('missing_key', 'default_value');

        $this->assertEquals('default_value', $result);
    }
}

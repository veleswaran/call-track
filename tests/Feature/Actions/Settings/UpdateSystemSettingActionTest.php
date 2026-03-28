<?php

declare(strict_types=1);

namespace Tests\Feature\Actions\Settings;

use App\Actions\Settings\UpdateSystemSettingAction;
use App\Domain\Settings\DTOs\UpdateSettingsDTO;
use App\Domain\Settings\Models\SystemSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateSystemSettingActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_updates_system_settings(): void
    {
        $action = new UpdateSystemSettingAction;
        $dto = new UpdateSettingsDTO([
            'test_key_1' => 'new_value_1',
            'test_key_2' => 123,
        ]);

        $action->execute($dto);

        $this->assertEquals('new_value_1', SystemSetting::where('key', 'test_key_1')->first()->value);
        $this->assertEquals(123, SystemSetting::where('key', 'test_key_2')->first()->value);
    }
}

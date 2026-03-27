<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Calls\Models\Contact;
use App\Domain\Users\Models\User;
use App\Support\PhoneNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CallLogTypeFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        Sanctum::actingAs($this->admin);

        // Clear cache for contact variations and enrichment before each test
        app(\App\Actions\Contacts\GetContactHashVariationsAction::class)->clearCache();
        \Illuminate\Support\Facades\Cache::flush();
    }

    public function test_can_filter_internal_call_logs(): void
    {
        // 1. Internal Contact
        $rawInternal = '15551112222';
        $internalPhone = PhoneNormalizer::normalize($rawInternal);
        $internalHash = hash('sha256', $internalPhone);

        Contact::factory()->create([
            'name' => 'Internal Contact',
            'phone_number' => $rawInternal,
            'phone_hash' => $internalHash,
            'is_internal' => true,
        ]);

        // 2. External Contact
        $rawExternal = '15553334444';
        $externalPhone = PhoneNormalizer::normalize($rawExternal);
        $externalHash = hash('sha256', $externalPhone);

        Contact::factory()->create([
            'name' => 'External Contact',
            'phone_number' => $rawExternal,
            'phone_hash' => $externalHash,
            'is_internal' => false,
        ]);

        // 3. Unknown Number (No contact)
        $rawUnknown = '15559990000';
        $unknownPhone = PhoneNormalizer::normalize($rawUnknown);
        $unknownHash = hash('sha256', $unknownPhone);

        // Create call logs with correct phone numbers and hashes
        CallLog::factory()->create([
            'phone_number' => $rawInternal,
            'phone_number_hash' => $internalHash,
        ]);
        CallLog::factory()->create([
            'phone_number' => $rawExternal,
            'phone_number_hash' => $externalHash,
        ]);
        CallLog::factory()->create([
            'phone_number' => $rawUnknown,
            'phone_number_hash' => $unknownHash,
        ]);

        // Clear cache again after creating contacts to ensure they are discovered
        app(\App\Actions\Contacts\GetContactHashVariationsAction::class)->clearCache();
        \Illuminate\Support\Facades\Cache::flush();

        // ACT: Filter by internal
        $response = $this->getJson('/api/v1/admin/call-logs?contact_filter=internal');

        // ASSERT: Only the internal call should be returned
        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.is_internal', true);
    }

    public function test_can_filter_external_call_logs_excludes_internal(): void
    {
        // 1. Internal Contact
        $rawInternal = '15551112222';
        $internalPhone = PhoneNormalizer::normalize($rawInternal);
        $internalHash = hash('sha256', $internalPhone);

        Contact::factory()->create([
            'name' => 'Internal Contact',
            'phone_number' => $rawInternal,
            'phone_hash' => $internalHash,
            'is_internal' => true,
        ]);

        // 2. External Contact
        $rawExternal = '15553334444';
        $externalPhone = PhoneNormalizer::normalize($rawExternal);
        $externalHash = hash('sha256', $externalPhone);

        Contact::factory()->create([
            'name' => 'External Contact',
            'phone_number' => $rawExternal,
            'phone_hash' => $externalHash,
            'is_internal' => false,
        ]);

        // 3. Unknown Number (No contact)
        $rawUnknown = '15559990000';
        $unknownPhone = PhoneNormalizer::normalize($rawUnknown);
        $unknownHash = hash('sha256', $unknownPhone);

        // Create call logs
        CallLog::factory()->create([
            'phone_number' => $rawInternal,
            'phone_number_hash' => $internalHash,
        ]);
        CallLog::factory()->create([
            'phone_number' => $rawExternal,
            'phone_number_hash' => $externalHash,
        ]);
        CallLog::factory()->create([
            'phone_number' => $rawUnknown,
            'phone_number_hash' => $unknownHash,
        ]);

        // Clear cache again after creating contacts
        app(\App\Actions\Contacts\GetContactHashVariationsAction::class)->clearCache();
        \Illuminate\Support\Facades\Cache::flush();

        // ACT: Filter by external
        $response = $this->getJson('/api/v1/admin/call-logs?contact_filter=external');

        // ASSERT: Internal call should be excluded (2 logs remaining: external + unknown)
        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.is_internal', false)
            ->assertJsonPath('data.1.is_internal', false);
    }
}

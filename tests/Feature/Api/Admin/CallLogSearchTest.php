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

class CallLogSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Create admin role if it doesn't exist (scope to test run)
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        Sanctum::actingAs($this->admin);
    }

    public function test_can_search_call_logs_by_phone_number(): void
    {
        $rawPhone = '+1 (555) 123-4567';
        $normalizedPhone = PhoneNormalizer::normalize($rawPhone);
        $hash = hash('sha256', $normalizedPhone);

        CallLog::factory()->create([
            'phone_number' => $rawPhone,
            'phone_number_hash' => $hash,
        ]);

        CallLog::factory()->create([
            'phone_number' => '+1 (555) 000-0000',
            'phone_number_hash' => hash('sha256', '15550000000'),
        ]);

        // Search using the same raw phone number
        $response = $this->getJson('/api/v1/admin/call-logs?search='.urlencode($rawPhone));

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.phone_number', $rawPhone);
    }

    public function test_can_search_call_logs_by_contact_name(): void
    {
        $phone = '15559876543';
        $hash = hash('sha256', $phone);
        $contactName = 'Alice Smith';

        Contact::factory()->create([
            'name' => $contactName,
            'phone_hash' => $hash,
            'phone_number' => $phone,
        ]);

        CallLog::factory()->create([
            'phone_number_hash' => $hash,
        ]);

        // Search for "Alice"
        $response = $this->getJson('/api/v1/admin/call-logs?search=Alice');

        $response->assertOk()
            ->assertJsonCount(1, 'data');

        // Note: The actual phone number in the response will depend on encryption
        // and how the resource handles it. We just care that we found the record.
    }

    public function test_returns_empty_when_no_search_match(): void
    {
        CallLog::factory()->create([
            'phone_number_hash' => hash('sha256', '1234567890'),
        ]);

        $response = $this->getJson('/api/v1/admin/call-logs?search=NonExistent');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    }
}

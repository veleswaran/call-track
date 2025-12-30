<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Calls\BuildCallLogQueryAction;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Calls\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BuildCallLogQueryActionTest extends TestCase
{
    use RefreshDatabase;

    private BuildCallLogQueryAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new BuildCallLogQueryAction();
    }

    /** @test */
    public function it_filters_by_search_term_matching_phone_number()
    {
        // 1. Create a call log with a specific phone number
        $phoneNumber = '+15551234567';
        $hash = hash('sha256', $phoneNumber);

        CallLog::factory()->create([
            'phone_number_hash' => $hash,
            'phone_number' => $phoneNumber,
            'created_at' => now(),
        ]);

        // Create unrelated
        CallLog::factory()->create([
            'phone_number_hash' => hash('sha256', '+1999999999'),
        ]);

        // Search for exact phone number
        $dto = new ListCallLogsDTO(
            page: 1,
            perPage: 10,
            search: $phoneNumber
        );

        $results = $this->action->execute($dto)->get();
        $this->assertCount(1, $results);
        $this->assertEquals($hash, $results->first()->phone_number_hash);
    }

    /** @test */
    public function it_filters_by_search_term_matching_contact_name_case_insensitive()
    {
        $name = 'John Doe';
        $phone = '15559876543';
        $hash = hash('sha256', $phone);

        Contact::factory()->create([
            'name' => $name,
            'phone_hash' => $hash,
            'phone_number' => $phone,
        ]);

        CallLog::factory()->create([
            'phone_number_hash' => $hash,
        ]);

        CallLog::factory()->create([ // Unrelated
            'phone_number_hash' => hash('sha256', '999999'),
        ]);

        // Search with lowercase 'john'
        $dto = new ListCallLogsDTO(
            page: 1,
            perPage: 10,
            search: 'john'
        );

        $results = $this->action->execute($dto)->get();
        
        $this->assertCount(1, $results);
        $this->assertEquals($hash, $results->first()->phone_number_hash);
    }

    /** @test */
    public function it_sorts_call_logs_by_timestamp_descending()
    {
        // Create older call
        $oldCall = CallLog::factory()->create([
            'timestamp' => now()->subDay(),
            'created_at' => now(), // newer db creation
        ]);

        // Create newer call
        $newCall = CallLog::factory()->create([
            'timestamp' => now(),
            'created_at' => now()->subDay(), // older db creation
        ]);

        $dto = new ListCallLogsDTO(page: 1, perPage: 10);
        $results = $this->action->execute($dto)->get();

        $this->assertCount(2, $results);
        
        // Should be New Call first (timestamp: now)
        $this->assertEquals($newCall->id, $results->first()->id);
        $this->assertEquals($oldCall->id, $results->last()->id);
    }
}

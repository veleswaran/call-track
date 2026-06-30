<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Contacts;

use App\Actions\Contacts\ImportContactsAction;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\ImportContactsDTO;
use App\Support\PhoneNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportContactsActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_imports_new_contacts_from_csv(): void
    {
        $csvPath = $this->createCsv(<<<'CSV'
name,phone_number,is_internal
John Doe,9876543210,true
Jane Smith,+919876543211,false
CSV);

        $result = app(ImportContactsAction::class)->execute(new ImportContactsDTO(filePath: $csvPath));

        $this->assertSame(2, $result->totalRows);
        $this->assertSame(2, $result->created);
        $this->assertSame(0, $result->updated);
        $this->assertSame(0, $result->failed);

        $this->assertDatabaseHas('contacts', [
            'name' => 'John Doe',
            'phone_hash' => hash('sha256', PhoneNormalizer::normalize('9876543210')),
            'is_internal' => true,
        ]);
    }

    public function test_it_updates_existing_contacts_by_phone_hash(): void
    {
        $normalizedPhone = PhoneNormalizer::normalize('9876543210');

        Contact::factory()->create([
            'name' => 'Old Name',
            'phone_number' => $normalizedPhone,
            'phone_hash' => hash('sha256', $normalizedPhone),
            'is_internal' => false,
        ]);

        $csvPath = $this->createCsv(<<<'CSV'
name,phone_number,is_internal
Updated Name,9876543210,true
CSV);

        $result = app(ImportContactsAction::class)->execute(new ImportContactsDTO(filePath: $csvPath));

        $this->assertSame(1, $result->totalRows);
        $this->assertSame(0, $result->created);
        $this->assertSame(1, $result->updated);
        $this->assertSame(0, $result->failed);

        $this->assertDatabaseHas('contacts', [
            'name' => 'Updated Name',
            'phone_hash' => hash('sha256', $normalizedPhone),
            'is_internal' => true,
        ]);
    }

    public function test_it_collects_row_validation_errors(): void
    {
        $csvPath = $this->createCsv(<<<'CSV'
name,phone_number,is_internal
,9876543210,false
Valid Name,,false
CSV);

        $result = app(ImportContactsAction::class)->execute(new ImportContactsDTO(filePath: $csvPath));

        $this->assertSame(2, $result->totalRows);
        $this->assertSame(0, $result->created);
        $this->assertSame(0, $result->updated);
        $this->assertSame(2, $result->failed);
        $this->assertCount(2, $result->errors);
    }

    public function test_it_rejects_files_missing_required_columns(): void
    {
        $csvPath = $this->createCsv("phone,is_internal\n9876543210,false\n");

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        app(ImportContactsAction::class)->execute(new ImportContactsDTO(filePath: $csvPath));
    }

    private function createCsv(string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'contacts-import-');
        file_put_contents($path, $contents);

        return $path;
    }
}

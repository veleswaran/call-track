<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Actions\Contacts\CreateOrUpdateContactAction;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use App\Services\Contacts\ContactManagementService;
use Mockery;
use Tests\TestCase;

class ContactManagementServiceTest extends TestCase
{
    public function test_it_delegates_contact_creation_to_action(): void
    {
        $action = Mockery::mock(CreateOrUpdateContactAction::class);
        $service = new ContactManagementService($action);

        $dto = new StoreContactDTO(
            name: 'Jane Doe',
            phoneNumber: '+9876543210'
        );

        $expectedContact = new Contact;
        $expectedContact->id = 1;
        $expectedContact->name = 'Jane Doe';

        $action->shouldReceive('execute')
            ->once()
            ->with($dto)
            ->andReturn($expectedContact);

        $result = $service->storeContact($dto);

        $this->assertEquals($expectedContact, $result);
        $this->assertEquals('Jane Doe', $result->name);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}

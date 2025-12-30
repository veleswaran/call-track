<?php

declare(strict_types=1);

namespace App\Services\Contacts;

use App\Actions\Contacts\CreateOrUpdateContactAction;
use App\Contracts\Services\ContactManagementServiceInterface;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;

class ContactManagementService implements ContactManagementServiceInterface
{
    public function __construct(
        private readonly CreateOrUpdateContactAction $createOrUpdateContactAction,
    ) {}

    public function storeContact(StoreContactDTO $data): Contact
    {
        return $this->createOrUpdateContactAction->execute($data);
    }
}

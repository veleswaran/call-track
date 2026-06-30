<?php

declare(strict_types=1);

namespace App\Services\Contacts;

use App\Actions\Contacts\CreateOrUpdateContactAction;
use App\Contracts\Services\ContactManagementServiceInterface;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\ImportContactsDTO;
use App\Domain\Contacts\DTOs\ImportContactsResultDTO;
use App\Domain\Contacts\DTOs\StoreContactDTO;

class ContactManagementService implements ContactManagementServiceInterface
{
    public function __construct(
        private readonly CreateOrUpdateContactAction $createOrUpdateContactAction,
        private readonly \App\Actions\Contacts\UpdateContactAction $updateContactAction,
        private readonly \App\Actions\Contacts\DeleteContactAction $deleteContactAction,
        private readonly \App\Actions\Contacts\ListContactsAction $listContactsAction,
        private readonly \App\Actions\Contacts\ImportContactsAction $importContactsAction,
    ) {}

    public function getPaginatedContacts(\App\Domain\Contacts\DTOs\ListContactsDTO $dto): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->listContactsAction->execute($dto);
    }

    public function storeContact(StoreContactDTO $data): Contact
    {
        return $this->createOrUpdateContactAction->execute($data);
    }

    public function updateContact(Contact $contact, StoreContactDTO $data): Contact
    {
        return $this->updateContactAction->execute($contact, $data);
    }

    public function deleteContact(Contact $contact): void
    {
        $this->deleteContactAction->execute($contact);
    }

    public function importContacts(ImportContactsDTO $dto): ImportContactsResultDTO
    {
        return $this->importContactsAction->execute($dto);
    }
}

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
        private readonly \App\Actions\Contacts\UpdateContactAction $updateContactAction,
        private readonly \App\Actions\Contacts\DeleteContactAction $deleteContactAction,
        private readonly \App\Actions\Contacts\ListContactsAction $listContactsAction,
    ) {}

    public function getPaginatedContacts(int $perPage = 15, ?string $search = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->listContactsAction->execute(
            new \App\Domain\Contacts\DTOs\ListContactsDTO(
                page: (int) request()->input('page', 1),
                perPage: $perPage,
                search: $search
            )
        );
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
}

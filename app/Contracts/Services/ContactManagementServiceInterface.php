<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\ImportContactsDTO;
use App\Domain\Contacts\DTOs\ImportContactsResultDTO;
use App\Domain\Contacts\DTOs\StoreContactDTO;

interface ContactManagementServiceInterface
{
    /**
     * Create or update a contact
     */
    public function storeContact(StoreContactDTO $data): Contact;

    public function updateContact(Contact $contact, StoreContactDTO $data): Contact;

    public function deleteContact(Contact $contact): void;

    /**
     * Get paginated contacts
     */
    public function getPaginatedContacts(\App\Domain\Contacts\DTOs\ListContactsDTO $dto): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    public function importContacts(ImportContactsDTO $dto): ImportContactsResultDTO;
}

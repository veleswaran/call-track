<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;

interface ContactManagementServiceInterface
{
    /**
     * Create or update a contact
     */
    public function storeContact(StoreContactDTO $data): Contact;

    public function updateContact(Contact $contact, StoreContactDTO $data): Contact;

    public function deleteContact(Contact $contact): void;
}

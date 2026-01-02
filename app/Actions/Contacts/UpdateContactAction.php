<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;

class UpdateContactAction
{
    public function execute(Contact $contact, StoreContactDTO $dto): Contact
    {
        $contact->update([
            'name' => $dto->name,
            // We hash/encrypt based on existing patterns.
            // Looking at CreateOrUpdateContactAction might be good to ensure consistency,
            // but usually we just update the fields.
            // Wait, phone number is unique logic in CreateOrUpdate.
            // Simple update might just need to update name?
            // If phone number changes, we need to update hash and encryption.
            'phone_hash' => hash('sha256', $dto->phoneNumber),
            'phone_number' => $dto->phoneNumber, // Casts handle encryption
        ]);

        return $contact;
    }
}

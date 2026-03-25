<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;

class UpdateContactAction
{
    public function __construct(
        protected \App\Actions\Contacts\GetContactHashVariationsAction $getVariationsAction
    ) {}

    public function execute(Contact $contact, StoreContactDTO $dto): Contact
    {
        $normalizedPhone = \App\Support\PhoneNormalizer::normalize($dto->phoneNumber);

        $contact->update([
            'name' => $dto->name,
            'phone_hash' => hash('sha256', $normalizedPhone),
            'phone_number' => $dto->phoneNumber,
            'is_internal' => $dto->isInternal,
        ]);

        $this->getVariationsAction->clearCache();

        return $contact;
    }
}

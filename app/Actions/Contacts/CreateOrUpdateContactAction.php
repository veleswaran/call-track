<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;

class CreateOrUpdateContactAction
{
    /**
     * Create or update a contact based on phone_hash (global)
     */
    public function __construct(
        protected \App\Actions\Contacts\GetContactHashVariationsAction $getVariationsAction
    ) {}

    public function execute(StoreContactDTO $data, bool $clearContactCache = true): Contact
    {
        $normalizedPhone = \App\Support\PhoneNormalizer::normalize($data->phoneNumber);
        $phoneHash = hash('sha256', $normalizedPhone);

        $contact = Contact::updateOrCreate(
            [
                'phone_hash' => $phoneHash,
            ],
            [
                'name' => $data->name,
                'phone_number' => $data->phoneNumber,
                'is_internal' => $data->isInternal,
            ]
        );

        if ($clearContactCache) {
            $this->getVariationsAction->clearCache();
        }

        return $contact;
    }
}

<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;

class CreateOrUpdateContactAction
{
    /**
     * Create or update a contact based on device_id and phone_hash
     */
    public function execute(StoreContactDTO $data): Contact
    {
        $phoneHash = hash('sha256', $data->phoneNumber);

        return Contact::updateOrCreate(
            [
                'device_id' => $data->deviceId,
                'phone_hash' => $phoneHash,
            ],
            [
                'name' => $data->name,
                'phone_number' => $data->phoneNumber,
            ]
        );
    }
}

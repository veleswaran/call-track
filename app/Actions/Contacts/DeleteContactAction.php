<?php

declare(strict_types=1);

namespace App\Actions\Contacts;

use App\Domain\Calls\Models\Contact;

class DeleteContactAction
{
    public function execute(Contact $contact): void
    {
        $contact->delete();
    }
}

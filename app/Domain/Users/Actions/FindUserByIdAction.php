<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Users\Models\User;

class FindUserByIdAction
{
    public function execute(int $id): ?User
    {
        return User::find($id);
    }
}

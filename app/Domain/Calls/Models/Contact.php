<?php

declare(strict_types=1);

namespace App\Domain\Calls\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Global contact (not device-scoped)
 *
 * @property int $id
 * @property string $name
 * @property string $phone_hash
 * @property string|null $phone_number
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Contact extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\ContactFactory::new();
    }

    protected $fillable = [
        'name',
        'phone_hash',
        'phone_number',
        'notes',
    ];

    protected $casts = [
        'phone_number' => 'encrypted',
    ];
}

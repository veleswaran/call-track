<?php

declare(strict_types=1);

namespace App\Domain\Agents\Models;

use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'employee_code',
        'status',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\AgentFactory::new();
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }
}

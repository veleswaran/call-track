<?php

declare(strict_types=1);

namespace App\Actions\Audit;

use App\Domain\Audit\Models\AuditEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogAuditEventAction
{
    /**
     * Log an audit event for a model change.
     *
     * @param  Model  $model  The model being audited
     * @param  string  $event  The event name (e.g., 'device.agent_changed')
     * @param  array|null  $oldValues  The old values
     * @param  array|null  $newValues  The new values
     */
    public function execute(
        Model $model,
        string $event,
        ?array $oldValues = null,
        ?array $newValues = null
    ): AuditEvent {
        return AuditEvent::create([
            'user_id' => Auth::id(),
            'event' => $event,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
        ]);
    }
}

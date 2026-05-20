<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Actions\Devices\SendPushNotificationAction;
use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Devices\DTOs\PushNotificationDTO;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class NotifyUnattendedEscalationsAction
{
    public function __construct(
        protected SendPushNotificationAction $sendPushAction
    ) {}

    /**
     * Notify devices of unattended missed call escalations.
     *
     * @return int The number of notifications sent.
     */
    public function execute(): int
    {
        $sentCount = 0;

        CallEscalation::with(['callLog.device'])
            ->where('status', 'unattended')
            ->whereNull('notified_at')
            ->chunkById(100, function ($escalations) use (&$sentCount) {
                foreach ($escalations as $escalation) {
                    $device = $escalation->callLog?->device;

                    if (! $device || empty($device->fcm_token)) {
                        Log::warning('Cannot notify unattended escalation: Device or FCM token missing.', [
                            'escalation_id' => $escalation->id,
                        ]);

                        continue;
                    }

                    $phone = $escalation->callLog->phone_number;
                    $title = __('notifications.unattended_missed_call.title');
                    $body = __('notifications.unattended_missed_call.body', ['phone' => $phone]);

                    $dto = new PushNotificationDTO(
                        device: $device,
                        title: $title,
                        body: $body
                    );

                    if ($this->sendPushAction->execute($dto)) {
                        $escalation->update([
                            'notified_at' => Carbon::now(),
                        ]);
                        $sentCount++;
                    }
                }
            });

        return $sentCount;
    }
}

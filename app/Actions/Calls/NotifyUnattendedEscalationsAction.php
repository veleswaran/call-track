<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Actions\Devices\SendPushNotificationAction;
use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Devices\DTOs\StaleHeartbeatNotificationDTO;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class NotifyUnattendedEscalationsAction
{
    public function __construct(
        protected SendPushNotificationAction $sendPushAction
    ) {}

    public function execute(): int
    {
        $escalations = CallEscalation::with(['callLog.device'])
            ->where('status', 'unattended')
            ->whereNull('notified_at')
            ->get();

        $sentCount = 0;

        foreach ($escalations as $escalation) {
            $device = $escalation->callLog?->device;

            if (! $device || empty($device->fcm_token)) {
                Log::warning("Cannot notify unattended escalation {$escalation->id}: Device or FCM token missing.");

                continue;
            }

            $phone = $escalation->callLog->phone_number;
            $title = 'Unattended Missed Call Alert';
            $body = "You have an unattended missed call from {$phone} that requires immediate follow-up.";

            $dto = new StaleHeartbeatNotificationDTO(
                device: $device,
                messageTitle: $title,
                messageBody: $body
            );

            if ($this->sendPushAction->execute($dto)) {
                $escalation->update([
                    'notified_at' => Carbon::now(),
                ]);
                $sentCount++;
            }
        }

        return $sentCount;
    }
}

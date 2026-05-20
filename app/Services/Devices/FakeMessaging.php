<?php

declare(strict_types=1);

namespace App\Services\Devices;

use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\AppInstance;
use Kreait\Firebase\Messaging\MulticastSendReport;

class FakeMessaging implements Messaging
{
    /**
     * @param  \Kreait\Firebase\Messaging\Message|array  $message
     */
    public function send($message, bool $validateOnly = false): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\Message|array  $message
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokens
     */
    public function sendMulticast($message, $registrationTokens, bool $validateOnly = false): MulticastSendReport
    {
        return MulticastSendReport::withItems([]);
    }

    /**
     * @param  \Kreait\Firebase\Messaging\Messages|array  $messages
     */
    public function sendAll($messages, bool $validateOnly = false): MulticastSendReport
    {
        return MulticastSendReport::withItems([]);
    }

    /**
     * @param  \Kreait\Firebase\Messaging\Message|array  $message
     */
    public function validate($message): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokenOrTokens
     */
    public function validateRegistrationTokens($registrationTokenOrTokens): array
    {
        return [
            'valid' => [],
            'unknown' => [],
            'invalid' => [],
        ];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\Topic|string  $topic
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokenOrTokens
     */
    public function subscribeToTopic($topic, $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokenOrTokens
     */
    public function subscribeToTopics(iterable $topics, $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\Topic|string  $topic
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokenOrTokens
     */
    public function unsubscribeFromTopic($topic, $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokenOrTokens
     */
    public function unsubscribeFromTopics(array $topics, $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\RegistrationTokens|\Kreait\Firebase\Messaging\RegistrationToken|array|string  $registrationTokenOrTokens
     */
    public function unsubscribeFromAllTopics($registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  \Kreait\Firebase\Messaging\RegistrationToken|string  $registrationToken
     */
    public function getAppInstance($registrationToken): AppInstance
    {
        throw new \RuntimeException('Not implemented');
    }
}

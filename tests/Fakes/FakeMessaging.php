<?php

declare(strict_types=1);

namespace Tests\Fakes;

use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\AppInstance;
use Kreait\Firebase\Messaging\Message;
use Kreait\Firebase\Messaging\Messages;
use Kreait\Firebase\Messaging\MulticastSendReport;
use Kreait\Firebase\Messaging\RegistrationToken;
use Kreait\Firebase\Messaging\RegistrationTokens;
use Kreait\Firebase\Messaging\Topic;

class FakeMessaging implements Messaging
{
    /**
     * @param  Message|array<mixed>  $message
     * @return array<array-key, mixed>
     */
    public function send(Message|array $message, bool $validateOnly = false): array
    {
        return [];
    }

    /**
     * @param  Message|array<mixed>  $message
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|string>|non-empty-string  $registrationTokens
     */
    public function sendMulticast(Message|array $message, RegistrationTokens|RegistrationToken|array|string $registrationTokens, bool $validateOnly = false): MulticastSendReport
    {
        return MulticastSendReport::withItems([]);
    }

    /**
     * @param  list<Message|array<mixed>>|Messages  $messages
     */
    public function sendAll(array|Messages $messages, bool $validateOnly = false): MulticastSendReport
    {
        return MulticastSendReport::withItems([]);
    }

    /**
     * @param  Message|array<mixed>  $message
     * @return array<non-empty-string, mixed>
     */
    public function validate(Message|array $message): array
    {
        return [];
    }

    /**
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|non-empty-string>|non-empty-string  $registrationTokenOrTokens
     * @return array{valid: list<non-empty-string>, unknown: list<non-empty-string>, invalid: list<non-empty-string>}
     */
    public function validateRegistrationTokens(RegistrationTokens|RegistrationToken|array|string $registrationTokenOrTokens): array
    {
        return [
            'valid' => [],
            'unknown' => [],
            'invalid' => [],
        ];
    }

    /**
     * @param  Topic|non-empty-string  $topic
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|non-empty-string>|non-empty-string  $registrationTokenOrTokens
     * @return array<string, array<string, string>>
     */
    public function subscribeToTopic(string|Topic $topic, RegistrationTokens|RegistrationToken|array|string $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  iterable<non-empty-string|Topic>  $topics
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|non-empty-string>|non-empty-string  $registrationTokenOrTokens
     * @return array<string, array<string, string>>
     */
    public function subscribeToTopics(iterable $topics, RegistrationTokens|RegistrationToken|array|string $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  Topic|non-empty-string  $topic
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|non-empty-string>|non-empty-string  $registrationTokenOrTokens
     * @return array<string, array<string, string>>
     */
    public function unsubscribeFromTopic(string|Topic $topic, RegistrationTokens|RegistrationToken|array|string $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  array<non-empty-string|Topic>  $topics
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|non-empty-string>|non-empty-string  $registrationTokenOrTokens
     * @return array<string, array<string, string>>
     */
    public function unsubscribeFromTopics(array $topics, RegistrationTokens|RegistrationToken|array|string $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  RegistrationTokens|RegistrationToken|list<RegistrationToken|non-empty-string>|non-empty-string  $registrationTokenOrTokens
     * @return array<string, array<string, string>>
     */
    public function unsubscribeFromAllTopics(RegistrationTokens|RegistrationToken|array|string $registrationTokenOrTokens): array
    {
        return [];
    }

    /**
     * @param  RegistrationToken|non-empty-string  $registrationToken
     */
    public function getAppInstance(RegistrationToken|string $registrationToken): AppInstance
    {
        throw new \RuntimeException('Not implemented');
    }
}

<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Automatically mock Firebase Messaging in all tests to avoid missing credentials file/network access errors.
        $messagingMock = $this->createMock(\Kreait\Firebase\Contract\Messaging::class);
        $this->app->instance(\Kreait\Firebase\Contract\Messaging::class, $messagingMock);
    }
}

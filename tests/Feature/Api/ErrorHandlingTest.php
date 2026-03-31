<?php

namespace Tests\Feature\Api;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_returns_json_404_for_non_existent_routes(): void
    {
        $response = $this->get('/api/v1/ghost', ['Accept' => 'text/html']);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Route not found.',
            ]);
    }

    #[Test]
    public function it_returns_friendly_404_for_missing_models(): void
    {
        Sanctum::actingAs(User::factory()->create(), ['*']);

        $response = $this->putJson('/api/v1/admin/contacts/99999', [
            'name' => 'Ghost Contact',
            'phone_number' => '5550000000',
            'is_internal' => false,
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Resource not found.',
            ]);
    }

    #[Test]
    public function it_returns_json_401_for_unauthenticated_requests(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }
}

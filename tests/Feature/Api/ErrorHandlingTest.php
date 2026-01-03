<?php

namespace Tests\Feature\Api;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_returns_json_404_for_non_existent_routes()
    {
        // Force accept html to ensure we override it for API routes
        $response = $this->get('/api/v1/ghost', ['Accept' => 'text/html']);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Route not found.',
            ]);
    }

    /** @test */
    public function it_returns_friendly_404_for_missing_models()
    {
        Sanctum::actingAs(User::factory()->create(), ['*']);

        // Use contacts update route with VALID payload to pass validation
        // This ensures code reaches the model retrieval part (findOrFail)
        $response = $this->putJson('/api/v1/admin/contacts/99999', [
            'name' => 'Ghost Contact',
            'phone_number' => '5550000000',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Resource not found.',
            ]);
    }

    /** @test */
    public function it_returns_json_401_for_unauthenticated_requests()
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }
}

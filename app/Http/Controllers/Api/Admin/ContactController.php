<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\ContactManagementServiceInterface;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function __construct(
        private readonly ContactManagementServiceInterface $contactService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', \App\Domain\Calls\Models\Contact::class);

        $search = $request->query('search');
        $perPage = (int) $request->query('per_page', '15');

        $contacts = $this->contactService->getPaginatedContacts($perPage, $search);

        return response()->json(\App\Http\Resources\ContactResource::collection($contacts)->response()->getData());
    }

    public function store(StoreContactRequest $request): JsonResponse
    {
        $dto = new StoreContactDTO(
            name: $request->string('name')->toString(),
            phoneNumber: $request->string('phone_number')->toString(),
        );

        $contact = $this->contactService->storeContact($dto);

        return response()->json($contact, 201);
    }

    public function update(StoreContactRequest $request, int $id): JsonResponse
    {
        $contact = \App\Domain\Calls\Models\Contact::findOrFail($id);

        $dto = new StoreContactDTO(
            name: $request->string('name')->toString(),
            phoneNumber: $request->string('phone_number')->toString(),
        );

        $updatedContact = $this->contactService->updateContact($contact, $dto);

        return response()->json($updatedContact);
    }

    public function destroy(int $id): JsonResponse
    {
        $contact = \App\Domain\Calls\Models\Contact::find($id);

        if (! $contact) {
            return response()->json(null, 204);
        }

        $this->contactService->deleteContact($contact);

        return response()->json(null, 204);
    }
}

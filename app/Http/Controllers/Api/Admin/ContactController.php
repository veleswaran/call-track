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
        $query = \App\Domain\Calls\Models\Contact::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(20));
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
}

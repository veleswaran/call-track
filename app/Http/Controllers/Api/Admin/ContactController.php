<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Calls\Models\Contact;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::query();

        if ($request->has('device_id')) {
            $query->where('device_id', $request->device_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|exists:devices,id',
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string',
        ]);

        $contact = Contact::updateOrCreate(
            [
                'device_id' => $validated['device_id'],
                'phone_hash' => hash('sha256', $validated['phone_number']),
            ],
            [
                'name' => $validated['name'],
                'phone_number' => $validated['phone_number'], // Store encrypted if model casts it.
            ]
        );

        return response()->json($contact, 201);
    }

    // update, delete methods omitted for MVP speed unless requested, store covers updateOrCreate
}

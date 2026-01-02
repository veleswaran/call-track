<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CallNoteController extends Controller
{
    public function __construct(
        protected \App\Contracts\Services\CallNoteServiceInterface $callNoteService
    ) {}

    public function update(Request $request, int $callLogId): JsonResponse
    {
        $request->validate([
            'note' => ['required', 'string', 'max:1000'],
        ]);

        $dto = new \App\DTOs\Calls\UpdateCallNoteDTO(
            callLogId: $callLogId,
            note: $request->input('note'),
            user: $request->user(),
        );

        $note = $this->callNoteService->updateCallNote($dto);

        return response()->json($note);
    }
}

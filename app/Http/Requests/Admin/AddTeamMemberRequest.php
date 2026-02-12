<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use Illuminate\Foundation\Http\FormRequest;

class AddTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth logic is usually in policies, handled by controller before this or via middleware
    }

    public function rules(): array
    {
        return [
            'agent_id' => ['required', 'integer', 'exists:agents,id'],
            'role' => ['nullable', 'string', 'in:MEMBER,MANAGER'],
        ];
    }

    public function toDTO(int $teamId): AddTeamMemberDTO
    {
        return new AddTeamMemberDTO(
            teamId: $teamId,
            agentId: (int) $this->integer('agent_id'),
            role: $this->input('role', 'MEMBER'),
        );
    }
}

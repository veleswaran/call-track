<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Teams\DTOs\UpdateTeamMemberRoleDTO;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => ['required', 'string', 'in:MEMBER,MANAGER'],
        ];
    }

    public function toDTO(int $teamId, int $agentId): UpdateTeamMemberRoleDTO
    {
        return new UpdateTeamMemberRoleDTO(
            teamId: $teamId,
            agentId: $agentId,
            role: $this->validated('role'),
        );
    }
}

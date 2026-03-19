# CallTrack AI: Agent Multi-Phone Linking & Internal Call Filtering

This plan outlines the implementation of the validated architecture for managing multiple agent phone numbers and filtering internal (agent-to-agent) calls from reporting.

## User Review Required

> [!IMPORTANT]
> This implementation introduces a new database table `agent_phone_numbers`. Existing agents will need their numbers migrated to this new structure if consistency for historical data is required.

## Proposed Changes

### [Backend] Domain & Data Layer

#### [NEW] [AgentPhoneNumber.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Agents/Models/AgentPhoneNumber.php)
- Define the Eloquent model with `encrypted` cast for `phone_number`.
- Add relationship to [Agent](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Agents/Models/Agent.php#20-54).

#### [NEW] [xxxx_create_agent_phone_numbers_table.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/database/migrations/xxxx_create_agent_phone_numbers_table.php)
- Create table with `agent_id`, `phone_number` (text), `phone_number_hash` (string, indexed), and `label`.

---

### [Backend] Logic & Services

#### [NEW] [FilterInternalCallsAction.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Actions/Calls/FilterInternalCallsAction.php)
- Implements the **Relational Shadowing** logic.
- Uses a `LEFT JOIN` on `agent_phone_numbers` within the call log query to exclude matches when `exclude_internal` is true.

#### [NEW] [StoreAgentPhoneNumberAction.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Actions/Agents/StoreAgentPhoneNumberAction.php)
- Handles normalization, hashing, and encryption before saving the new number link.

---

### [Backend] API Layer

#### [NEW] [AgentPhoneNumberController.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Http/Controllers/Api/V1/Admin/AgentPhoneNumberController.php)
- Expose resource endpoints for linking/unlinking numbers for an agent.

#### [MODIFY] [CallLogController.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Http/Controllers/Api/V1/Admin/CallLogController.php)
- Update to accept `exclude_internal` parameter and pass it to the service layer.

---

### [Frontend] Agent Management

#### [NEW] [agent-phone-manager.tsx](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/src/features/agents/components/agent-phone-manager.tsx)
- Add a dynamic UI component to the agent edit page to manage phone numbers.

---

## Verification Plan

### Automated Tests
- **Unit**: Verify `FilterInternalCallsAction` correctly applies the join and filters results.
- **Unit**: Verify `StoreAgentPhoneNumberAction` correctly hashes and encrypts data.
- **Feature**: End-to-end API test for `/api/v1/admin/call-logs?exclude_internal=true`.

### Manual Verification
- Link an agent to two phone numbers.
- Make a call between those two numbers (or mock the data).
- Verify the call is visible in raw logs but disappears when "Exclude Internal" is toggled in the Admin UI.

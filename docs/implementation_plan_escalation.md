# Missed Call Escalation Engine Implementation Plan

Implementation plan for the Missed-Call Tracking & Insights feature (MVP-2) as outlined in the PRD, strictly adhering to the "Antigravity Standard" architecture.

## Goal Description

Introduce a dedicated Escalation & SLA Management engine to track unattended missed calls without violating the immutability of the existing `call_logs` table. The system will automatically calculate response deadlines (SLA), flag overdue calls via background jobs, and resolve them when a follow-up call occurs. It will expose a paginated REST API for the Next.js frontend to render a Missed Call Insights Dashboard.

## Proposed Changes

### Database Requirements

To strictly maintain the rule that `call_logs` is **central, high-volume, insert-only, and never updated**, we cannot store mutable escalation status directly on the call log record. We will introduce a new governance table.

#### [NEW] `database/migrations/YYYY_MM_DD_HHMMSS_create_call_escalations_table.php`
- `id` (PK)
- `call_log_id` (FK to `call_logs`, unique)
- `status` (Enum/String: pending, unattended, resolved)
- `response_due_at` (Timestamp)
- `resolved_at` (Timestamp, nullable)
- `resolved_by_call_id` (FK to `call_logs`, nullable - the outgoing call that resolved it)
- `created_at`, `updated_at`

#### [MODIFY] `database/migrations/2026_03_06_163138_create_system_settings_table.php`
- Add initial seeder configuration array for `escalation_sla_hours` (default to e.g., 2 hours).

---

### Domain Actions (Business Logic)

#### [NEW] `app/Actions/Escalations/CalculateSlaDeadlineAction.php`
- Pure logic: Takes the `call_logs.timestamp` and adds `escalation_sla_hours` from `system_settings` to return a `response_due_at` Carbon instance.

#### [NEW] `app/Actions/Escalations/CreatePendingEscalationAction.php`
- Inserts a new row into `call_escalations` for an incoming missed call.

#### [NEW] `app/Actions/Escalations/FlagOverdueEscalationsAction.php`
- Queries `call_escalations` where `status = 'pending'` and `response_due_at < now()`, updating them to `'unattended'`.

#### [NEW] `app/Actions/Escalations/ResolveEscalationAction.php`
- Given an outgoing call log, finds pending/unattended records for the same agent/phone number and updates them to `'resolved'` with `resolved_at` and `resolved_by_call_id`.

---

### Services (Orchestration)

#### [NEW] `app/Contracts/Services/EscalationServiceContract.php`
- Interface defining methods: `handleMissedCall()`, `processOverdueSlas()`, `attemptResolutionFromOutgoingCall()`, `getEscalationInsights()`, `getEscalationSummary()`.

#### [NEW] `app/Services/EscalationService.php`
- Implements `EscalationServiceContract`. Orchestrates the Actions above based on inputs.

---

### Jobs & Event Listeners

#### [NEW] `app/Jobs/EvaluateEscalationSlasJob.php`
- Scheduled job (runs every 5-15 mins via Laravel Scheduler). Calls `EscalationService->processOverdueSlas()`.

#### [NEW] `app/Jobs/ProcessMissedCallEscalationJob.php`
- Queued job. Takes a `call_log_id` and calls `EscalationService->handleMissedCall()`.

#### [NEW] `app/Jobs/AttemptEscalationResolutionJob.php`
- Queued job. Takes a `call_log_id` and calls `EscalationService->attemptResolutionFromOutgoingCall()`.

#### [MODIFY] `app/Listeners/ProcessIngestedCallLogListener.php` (or similar existing ingestion event hook)
- When a new `call_log` is ingested, we **dispatch immediately to a queue** to prevent blocking the high-volume ingestion API response:
  - If `direction === MISSED`: `ProcessMissedCallEscalationJob::dispatch($callLog->id)`.
  - If `direction === OUTGOING` and duration > 0: `AttemptEscalationResolutionJob::dispatch($callLog->id)`.

---

### HTTP / API Layer

#### [NEW] `app/Http/Controllers/Api/V1/EscalationInsightController.php`
- **Skinny Controller**:
  - Validates query params (date range, team, agent, status) using `GetEscalationInsightsRequest`.
  - Calls `EscalationService->getEscalationInsights(EscalationFilterDTO)` to get paginated logs.
  - Calls `EscalationService->getEscalationSummary(EscalationFilterDTO)` to get the summary stats.
  - Returns paginated `CallLogResource` along with a meta object containing summary counts (total missed, pending, unattended, resolved).

#### [NEW] `app/Http/Requests/GetEscalationInsightsRequest.php`
- Validates query parameters (`team_id`, `agent_id`, `status`, `date_from`, `date_to`).

#### [NEW] `app/DTOs/EscalationFilterDTO.php`
- Immutable DTO passed from Controller to Service.

#### [MODIFY] `routes/api.php`
- Register `GET /api/v1/call-logs/escalations`.
- Ensure properly wrapped in Sanctum Auth and existing Role/Policy middleware.

---

### Frontend Layer (Next.js Application)

#### [NEW] `src/features/missed-calls/api/get-escalations.ts`
- TanStack Query hook `useEscalationInsights(filters)` calling the new `/api/v1/call-logs/escalations` endpoint.

#### [NEW] `src/features/missed-calls/components/MissedCallSummaryWidgets.tsx`
- Shadcn/ui cards displaying the summary of missed calls by agent and team. Includes metric totals for Total Missed, Pending, Unattended, and Resolved within the filtered date range.

#### [NEW] `src/features/missed-calls/components/MissedCallsTable.tsx`
- Shadcn/ui data table displaying the paginated list. Columns: Agent, Client Number, Call Time, Escalation Status, Resolution Deadline.

#### [NEW] `src/features/missed-calls/components/MissedCallsFilters.tsx`
- UI controls for filtering the table and widgets by Date Range, Team (via context/API), and Status (Pending, Unattended, Resolved).

#### [NEW] `src/app/(admin)/insights/missed-calls/page.tsx`
- The Next.js Route/Page container. Composes the `MissedCallsFilters`, `MissedCallSummaryWidgets`, and `MissedCallsTable`. Server Component rendering a strictly typed Client Component shell.

#### [MODIFY] `src/features/settings/components/SlaSettingsForm.tsx` (or equivalent)
- Add a new section to configure `escalation_sla_hours`, hitting an existing settings update API endpoint.

## Verification Plan

### Automated Tests
Run the following commands using the user's terminal:
1. `php artisan test --filter=CalculateSlaDeadlineActionTest` (Unit Test)
2. `php artisan test --filter=FlagOverdueEscalationsActionTest` (Unit Test)
3. `php artisan test --filter=ResolveEscalationActionTest` (Unit Test)
4. `php artisan test --filter=EscalationInsightControllerTest` (Feature Test - verifies permissions, pagination, and response matching the DTO structure).

### Manual Verification
1. Open the project in Tinkwell or run `php artisan tinker`.
2. Simulate a missed call ingestion. Check DB that `call_escalations` was created with `pending` status.
3. Manually run the schedule: `php artisan schedule:run` and verify status changes to `unattended` if `response_due_at` has passed.
4. Simulate an outgoing call to the same number. Verify the escalation status changes to `resolved`.

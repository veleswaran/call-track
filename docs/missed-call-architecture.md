# Architecture Decision Document
## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
11 Functional Requirements focusing on tracking missed calls, calculating SLA deadlines, flagging unattended calls via background jobs, and providing an admin dashboard with widgets and filtering for insights.

**Non-Functional Requirements:**
- **Data Integrity:** Idempotent ingestion and resolution processing (critical due to potential out-of-order syncing).
- **Immutability:** Extreme strictness around preserving the `call_logs` table as insert-only.
- **Performance:** Background job processing within 15 minutes of SLA breach.

**Scale & Complexity:**
Medium complexity due to the separation of mutable escalation state from immutable call logs and the asynchronous job orchestration requirements.

- Primary domain: Full-Stack (Laravel API + Next.js UI)
- Complexity level: Medium
- Estimated architectural components: ~15 (Actions, Jobs, Services, Controllers, React Components, Hooks)

### Technical Constraints & Dependencies

- Must strictly follow the "Antigravity Standard" PHP guidelines and Next.js guidelines.
- Cannot mutate `call_logs` table.
- All backend access from UI must go through `src/shared/api/`.

### Cross-Cutting Concerns Identified

- **Idempotency:** Late-arriving device logs must not improperly trigger or resolve escalations out of chronological order.
- **Strict Layering Rules:** UI Components cannot contain API logic; Controllers cannot contain business logic.

## Starter Template Evaluation

### Primary Technology Domain

Full-Stack (Laravel API + Next.js UI) based on project requirements analysis and existing MVP architecture.

### Starter Options Considered

Since CallTrack is an existing MVP, we are not selecting a greenfield starter template (like `create-next-app`). The technical foundation is already established by the **Antigravity Standard** and the **Next.js Admin Frontend Standard**.

### Selected Starter: Existing CallTrack Architecture

**Rationale for Selection:**
We are building a feature extension (MVP-2) into an active, governed codebase. We must use the existing architectural scaffolding rather than introducing a new starter framework.

**Initialization Command:**

No new CLI initialization command is required. Feature development begins by creating the new Database Migrations and Next.js Feature folders respectively.

**Architectural Decisions Provided by Existing Scaffold:**

**Language & Runtime:**
- PHP 8.4
- TypeScript Strict Mode
- React 18+

**Styling Solution:**
- Tailwind CSS via `shadcn/ui` base primitives.

**Testing Framework:**
- PHPUnit for Backend Services and Actions.
- Vitest for Frontend Hooks, API services, and Feature Components.

**Code Organization:**
- **Frontend**: Feature-grouped architecture (`src/features/missed-calls/`).
- **Backend**: Strict Layering (`Controllers -> Services (Contracts) -> Actions -> Models`).

**Note:** Project initialization for this feature means scaffolding the specific folder structures dictated by the `.gemini/*` style guides.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Idempotency Strategy for Late-Syncing Logs**: If a device is offline and syncs a missed call 3 days late, the SLA calculation and background job MUST retroactively evaluate its state and not blindly send push notifications for outdated escalations.

**Important Decisions (Shape Architecture):**
- **Job Queuing Driver**: Standardizing on the Laravel Database queue driver (default for Laravel 11/12) to avoid introducing Redis as a hard infrastructure dependency for MVP-2, keeping deployment simple.

**Deferred Decisions (Post-MVP):**
- **Advanced SLA Calendars**: Excluding weekends or applying custom business hours to SLA timers is deferred to Post-MVP (Phase 2).

### Data Architecture
- **Decision:** Relational Isolation of State.
- **Rationale:** Creating `call_escalations` to store mutable status (pending, unattended, resolved) preserves the `call_logs` table's insert-only append-log integrity.

### Authentication & Security
- **Decision:** Laravel Sanctum Token Auth.
- **Rationale:** Pre-decided by system constraints. Admin endpoints will be locked behind existing RBAC policies.

### API & Communication Patterns
- **Decision:** Asynchronous Job Dispatching on Ingestion.
- **Rationale:** When the `/api/v1/sync` endpoint takes in the high-volume payload, we will emit an event that queues `ProcessMissedCallEscalationJob` rather than processing SLAs synchronously. This keeps the API response time extremely fast for devices with poor connectivity.

### Frontend Architecture
- **Decision:** TanStack Query + Server/Client Component Separation.
- **Rationale:** The `insights/missed-calls/page.tsx` will be a Server Component to handle basic layout and metadata, passing off to Client Components using `useQuery` for the interactive filtering, data tables, and summary widgets.

### Infrastructure & Deployment
- **Decision:** Laravel Database Queue.
- **Rationale:** Minimizes infrastructure complexity on AWS Amplify / standard hosting rather than requiring a dedicated Redis cluster for this initial engine hook.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
4 areas where AI agents could make different choices (File Naming, Component Structure, DTO boundaries, and Error Handling).

### Naming Patterns

**Database Naming Conventions:**
- Tables must be `snake_case` and plural (e.g., `call_escalations`).
- Foreign keys must be `singular_table_name_id` (e.g., `call_log_id`).

**API Naming Conventions:**
- Base route: `/api/v1/`
- Endpoints must be kebab-case resources (e.g., `/api/v1/call-logs/escalations`).
- Query parameters must be snake_case (e.g., `team_id`, `date_from`).

**Code Naming Conventions:**
- **Laravel:** Classes in `StudlyCase`, methods in `camelCase`. Interfaces suffixed with `Contract` or `Interface` depending on directory layout (e.g., `EscalationServiceContract`).
- **Next.js:** Components in `PascalCase` (e.g., `MissedCallsTable`), files representing components in `kebab-case.tsx` (e.g., `missed-calls-table.tsx`), utility/hook files in `kebab-case.ts`.

### Structure Patterns

**Project Organization:**
- **Backend:** `app/Http/Controllers` (HTTP parsing only) -> `app/DTOs` -> `app/Services` (Orchestration) -> `app/Actions` (Business Logic) -> `app/Models` (Passive Data).
- **Frontend:** Domain-driven features directory `src/features/<feature-name>/{components,api,hooks}/`.

### Format Patterns

**API Response Formats:**
- Controllers must return Laravel `JsonResource` or `ResourceCollection`.
- Wrappers must follow existing generic `{ data: {...}, meta: {...} }` format. Next.js API client must expect this structure.

**Data Exchange Formats:**
- **Strict Boundary:** All requests entering a Service must be encapsulated in a DTO (`EscalationFilterDTO`). Arrays or Request objects cannot be passed into Services/Actions.
- Dates must be ISO 8601 strings (UTC) over the wire.

### Process Patterns

**Error Handling Patterns:**
- Background Jobs must implement `failed()` to handle ingestion resolution failures logging.
- Next.js forms/API hooks must use `toast` notifications for error presentation (via `shadcn/ui` use-toast hook).

### Enforcement Guidelines

**All AI Agents MUST:**
- Never mutate the `call_logs` table (inserts only).
- Never place business logic inside a Controller or a Next.js Server Component route layout.
- Always validate incoming API requests using `FormRequest` before constructing a DTO.

### Pattern Examples

**Good Examples:**
```php
// Laravel - Strict DTO usage
public function getEscalationInsights(GetEscalationInsightsRequest $request) {
    $dto = EscalationFilterDTO::fromRequest($request);
    return CallLogResource::collection($this->escalationService->getInsights($dto));
}
```

```tsx
// Next.js - Component Structure
export function MissedCallsTable({ data }: { data: CallLog[] }) {
    // Pure presentation
}
```

**Anti-Patterns:**
```php
// Anti-Pattern: Controller doing logic instead of passing DTO to Service
public function resolveCall(Request $request) {
    CallEscalation::where('id', $request->id)->update(['status' => 'resolved']); 
}
```

## Project Structure & Boundaries

### Complete Project Directory Structure

**Backend (Laravel 12 API)**
```
calltrack/
├── app/
│   ├── DTOs/
│   │   └── Calls/
│   │       ├── EscalationFilterDTO.php
│   │       └── StoreCallLogDTO.php       (Updated context)
│   ├── Actions/
│   │   └── Calls/
│   │       ├── CalculateSlaDeadlineAction.php
│   │       ├── CreatePendingEscalationAction.php
│   │       ├── FlagOverdueEscalationsAction.php
│   │       └── ResolveEscalationAction.php
│   ├── Contracts/
│   │   └── Services/
│   │       └── EscalationServiceContract.php
│   ├── Services/
│   │   └── EscalationService.php
│   ├── Jobs/
│   │   └── MissedCalls/
│   │       ├── EvaluateEscalationSlasJob.php
│   │       ├── ProcessMissedCallEscalationJob.php
│   │       └── AttemptEscalationResolutionJob.php
│   ├── Models/
│   │   ├── CallLog.php                   (Existing)
│   │   └── CallEscalation.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           └── EscalationInsightController.php
│   │   └── Requests/
│   │       └── GetEscalationInsightsRequest.php
│   └── Console/
│       └── Commands/
│           └── ProcessMissedCallSLAs.php (Mocks job execution)
├── database/
│   └── migrations/
│       └── 2026_03_10_000000_create_call_escalations_table.php
└── routes/
    └── api.php                           (Updated with /escalations)
```

**Frontend (Next.js App Router)**
```
calltrack-frontend/
├── src/
│   ├── app/
│   │   └── (admin)/
│   │       └── insights/
│   │           └── missed-calls/
│   │               └── page.tsx          (Server Component)
│   ├── features/
│   │   └── missed-calls/
│   │       ├── api/
│   │       │   └── get-escalations.ts    (TanStack fetch hook)
│   │       ├── components/
│   │       │   ├── missed-calls-table.tsx
│   │       │   ├── missed-calls-filters.tsx
│   │       │   └── missed-call-summary-widgets.tsx
│   │       └── types/
│   │           └── escalation.ts         (TypeScript Interfaces)
│   └── shared/
│       └── api/
│           └── apiClient.ts              (Existing Axios wrapper)
```

### Architectural Boundaries

**API Boundaries:**
- **Boundary:** Frontend features calling the API must do so exclusively via hooks (`get-escalations.ts`) that utilize the `shared/api/apiClient`.
- **Enforcement:** No raw `fetch` calls allowed in `feature/missed-calls/components/`.

**Component Boundaries:**
- **Boundary:** Next.js Server Components (`page.tsx`) pass parameters (`searchParams`) to Client Components.
- **Enforcement:** No interactive hooks inside `page.tsx`. React Query usage is restricted to Client Components under `features/missed-calls/components`.

**Service Boundaries:**
- **Boundary:** The `EscalationService` is the only way Controllers or Jobs interact with the escalation lifecycle.
- **Enforcement:** Actions (`CalculateSlaDeadlineAction`, etc.) must not be called directly from Controllers; they are orchestrated by `EscalationService`.

**Data Boundaries:**
- **Boundary:** Changes to status MUST occur only via `CallEscalation`.
- **Enforcement:** The `CallLog` model is treated strictly as read/insert only.

### Requirements to Structure Mapping

**Epic/Feature Mapping:**
- **Escalation & SLA Management (FR1-FR5)**: `app/Actions/Calls/`, `app/Services/EscalationService.php`, `app/Jobs/MissedCalls/`
- **Missed Call Insights Dashboard (FR6-FR9)**: `src/features/missed-calls/`, `app/Http/Controllers/Api/V1/EscalationInsightController.php`
- **Configuration Updates (FR11)**: Updates to `system_settings` interaction via `EscalationService` or `CalculateSlaDeadlineAction`.

### Integration Points

**Internal Communication:**
- **Job Events**: The ingestion of a call log (`StoreCallLogAction`) dispatches a standard Laravel event or immediately queues the `ProcessMissedCallEscalationJob`.
- **SLA Cron**: The Laravel Scheduler runs `ProcessMissedCallSLAs` (command) which dispatches `EvaluateEscalationSlasJob` every 15 minutes.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
High. The strictly enforced separation (Controllers parsing HTTP -> DTO -> Service -> Action -> Storage) seamlessly supports Next.js Server/Client component interactions since all business logic is safely contained within Laravel Jobs and Actions. No overlapping state responsibilities.

**Pattern Consistency:**
High. Naming conventions, component boundaries, and specific DTO encapsulation rules are clearly established and mapped.

**Structure Alignment:**
High. The physical project structure perfectly mirrors the architectural rules (e.g., dedicated `src/features/missed-calls/` directory isolates the frontend code).

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
No Epics are currently defined (identified as a critical gap in Implementation Readiness), but the architecture structurally supports all necessary Epic breakdown areas.

**Functional Requirements Coverage:**
Complete. FR1-FR5 covered by Laravel Jobs & Actions. FR6-FR9 covered by Next.js components and the `getEscalationInsights` endpoint. FR11 covered by `system_settings` interaction.

**Non-Functional Requirements Coverage:**
Complete. Background job dispatching ensures high API throughput. Idempotency handling is explicitly mandated for the resolution jobs. Immutable append-only logging is safeguarded by the introduction of the `call_escalations` table.

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions (DB queuing, Idempotency, Separation of State, Sanctum Auth) are documented.

**Structure Completeness:**
Full directory trees for both Laravel and Next.js are mapped.

**Pattern Completeness:**
Strongly typed boundaries (DTOs) and strict isolation rules (no logic in Controllers or `page.tsx`) are established.


### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete


**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

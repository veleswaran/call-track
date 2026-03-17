# Architecture Decision Document: Agent Multi-Phone Linking & Internal Call Filtering

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- **FR1**: Manage multiple phone numbers per agent.
- **FR2**: Exclude "agent-to-agent" calls from lead/performance reports.
- **FR3**: Maintain the privacy-first hashing strategy for linked phone numbers.

**Non-Functional Requirements:**
- **Performance**: Query-level filtering must remain efficient even with large call volumes.
- **Immutability**: raw `call_logs` must NOT be updated or deleted.

**Scale & Complexity:**
- Primary domain: **Full-Stack**
- Complexity level: **Medium**
- Estimated architectural components: **~8** (Models, Migrations, Actions, DTOs, Controllers, UI Filters)

### Technical Constraints & Dependencies
- Strictly follow **Antigravity Standard** (DTOs, Actions, Services).
- Encrypt phone numbers at rest; use SHA-256 hashes for lookups.

### Cross-Cutting Concerns Identified
- **Internal Call Deduplication**: Ensuring calls between two agents aren't counted twice or misclassified.
- **Relational Shadowing**: Using a dedicated lookup table for active agent phone hashes to ensure high-performance filtering without violating immutability.

## Starter Template Evaluation

### Primary Technology Domain
**Full-stack (API-first)** based on project requirements analysis.

### Selected Starter: Custom Antigravity Foundation (Existing)

**Rationale for Selection:**
The project is built on the **Antigravity Standard**, which enforces a strict layered architecture (Controllers -> Services -> Actions -> Models) essential for enterprise scalability and immutable data governance. It leverages Laravel 12 and Next.js 15, which are currently state-of-the-art for this domain.

**Architectural Decisions Provided by Starter:**

- **Language & Runtime**: PHP 8.4 with `strict_types=1`; Node.js 20+ with TypeScript.
- **Styling Solution**: Tailwind CSS for utility-first styling; shadcn/ui for accessible primitive components.
- **Testing Framework**: PHPUnit and PEST (Backend); Vitest (Frontend) for high-speed unit and feature testing.
- **Code Organization**: Domain-Driven Design (DDD) with clear boundaries between ingestion and governance.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Data Model**: Use a relational table `agent_phone_numbers` rather than JSON attributes.
- **Filtering Logic**: Implement "Relational Shadowing" via database-level `LEFT JOIN` in reporting actions.

**Important Decisions (Shape Architecture):**
- **Security**: Use the same SHA-256 hashing strategy for linked numbers as used in raw ingestion to facilitate lookups.
- **API Versioning**: Introduce `v1` admin filtering parameters.

**Deferred Decisions (Post-MVP):**
- **Global Search**: Searching for agents by masked/hashed numbers will be addressed in a future story.

### Data Architecture
- **Model**: `AgentPhoneNumber` linked to `Agent`.
- **Fields**: `id`, `agent_id`, `phone_number` (encrypted), `phone_number_hash` (indexed), `label`.
- **Rationale**: Relational integrity and efficient join-based filtering.

### API & Communication Patterns
- **Protocol**: REST API.
- **Parameters**: `exclude_internal` (boolean) on `GET /api/v1/admin/call-logs`.
- **Response**: Use `CallLogResource` to ensure consistent data masking.

## Implementation Patterns & Consistency Rules

### Naming Patterns
- **Database**: `agent_phone_numbers` table; `agent_id` foreign key.
- **API**: `POST /api/v1/admin/agents/{agent}/phone-numbers` for linking.
- **Query Params**: Use `snake_case` for API parameters (e.g., `exclude_internal`).

### Structure Patterns
- **Action Placement**: Filtering logic MUST reside in `app/Actions/Calls/FilterInternalCallsAction.php`.
- **DTO Consistency**: All data transfer for phone linking must use `StoreAgentPhoneNumberDTO`.

### Format Patterns
- **Hashing**: Use SHA-256 after normalization via `\App\Support\PhoneNormalizer`.
- **Encryption**: Use Laravel's standard `encrypted` cast for the `phone_number` field in the database.

## Project Structure & Boundaries

### Complete Project Directory Structure

**Backend (Laravel)**
```text
app/
├── Actions/
│   ├── Agents/
│   │   └── StoreAgentPhoneNumberAction.php (Handles number linking)
│   └── Calls/
│       └── FilterInternalCallsAction.php (Relational Shadowing Logic)
├── Domain/
│   ├── Agents/
│   │   ├── Models/
│   │   │   └── AgentPhoneNumber.php
│   │   └── DTOs/
│   │       └── StoreAgentPhoneNumberDTO.php
│   └── Calls/
│       └── DTOs/
│           └── CallLogFiltersDTO.php (Updated with exclude_internal)
├── Http/
│   ├── Controllers/
│   │   └── Api/V1/Admin/
│   │       └── AgentPhoneNumberController.php
│   └── Resources/V1/
│       └── Agents/
│           └── AgentPhoneNumberResource.php
database/migrations/
└── xxxx_create_agent_phone_numbers_table.php
```

**Frontend (Next.js)**
```text
src/features/agents/
├── components/
│   └── agent-phone-manager.tsx (Management UI)
├── hooks/
│   └── use-agent-phone-link.ts (Data Fetching/Mutations)
└── api/
    └── agent-api.ts (Backend endpoints)
```

### Architectural Boundaries
- **Ingestion Consistency**: The `FilterInternalCallsAction` MUST use the same normalization and hashing logic as `IngestCallLogsAction` to ensure exact match lookups.
- **Read-Only Filtering**: Filtering is applied at the query level; the underlying `call_logs` table remains immutable and untouched.

## Architecture Validation Results

### Coherence Validation ✅
- **Decision Compatibility**: Relational joins are perfectly compatible with the required O(log n) performance for Relational Shadowing.
- **Pattern Consistency**: Actions decouple business logic from Controllers/Models, satisfying the Antigravity Standard.

### Requirements Coverage Validation ✅
- **FR1 (Multi-phone)**: Covered by `AgentPhoneNumber` schema and management API.
- **FR2 (Internal filtering)**: Covered by high-performance `LEFT JOIN` strategy.
- **FR3 (Privacy)**: Covered by SHA-256 hashing and encryption patterns.
- **NFR (Immutability)**: Ensures `raw_call_logs` are never modified.

### Implementation Readiness Validation ✅
- **Overall Status**: **READY FOR IMPLEMENTATION**
- **Confidence Level**: **High**

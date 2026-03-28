# Architecture Decision Document

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The customer engagement report will focus on **Relationship & Loyalty Metrics** using optimized data paths:
- **FR1 (Customer Sticky Index)**: Calculate unique interaction days per customer. *Refinement: Interaction = Outgoing OR (Incoming AND duration > `min_interaction_duration`).*
- **FR2 (Configurable Interaction Threshold)**: Managers can set the `min_interaction_duration` (default 10s) in system settings.
- **FR3 (Contact Recency)**: Track the last **Business-only** interaction time for each customer.
- **FR4 (Engagement Depth)**: Analyze talk-time vs. frequency ratio, excluding internal and non-business calls.
- **FR5 (Top Engaged Customers)**: Rank customers by aggregate business talk-time to identify most valuable accounts.
- **FR6 (Analytics Surface)**: dedicated API under `/api/v1/admin/analytics/loyalty` + Next.js widgets.
- **FR7 (Operational Efficiency)**: Measure the % of `Business` talk-time per agent compared to total call activity.

**Non-Functional Requirements:**
- **NFR1 (Response Time)**: Dashboards load in < 1.0s using **Relational Shadowing (Aggregates)**.
- **NFR2 (Governance)**: Grouping strictly by SHA-256 phone hashes; no raw PII in reporting layers.
- **NFR3 (Privacy)**: Adhere to existing encryption standards for all phone number data.

**Scale & Complexity:**
- Primary domain: **Full-Stack (Laravel + Next.js)**
- Complexity level: **Medium-High** (due to pre-aggregation and configurable logic).
- Estimated architectural components: **~14** (DTOs, Actions, Repository-style Aggregation Service, API Resources, System Settings Integration).

### Technical Constraints & Dependencies
- **Antigravity Standard**: Absolute dependency direction (Controller -> Service -> Action -> Model).
- **Optimization Strategy**: Utilize a dedicated `analytics_customer_loyalty` aggregate table or Materialized Views to avoid full-table scans on `call_logs`.
- **Relational Shadowing**: Update aggregates asynchronously via `CallLogCreated` events.

### Cross-Cutting Concerns Identified
- **Data Freshness**: Determining if analytics should be "live" (computed on request) or "shadowed" (pre-computed via background jobs) to meet performance NFRs.
- **Hashing Consistency**: Ensuring normalized phone hashing for accurate cross-log customer identification.
- **Team-Level Scoping**: Restricting visibility based on the Manager-Agent hierarchy.

## Starter Template Evaluation

### Primary Technology Domain
**Full-Stack (Laravel 12 API + Next.js 15)** based on existing project infrastructure and domain requirements.

### Starter Options Considered
As this is a feature extension for an existing platform, we are utilizing the established **CallTrack Enterprise Foundation** rather than a new third-party starter. This ensures total consistency with the "Antigravity Standard" already in place.

### Selected Starter: CallTrack Enterprise Foundation (Existing)
**Rationale for Selection:**
The existing foundation provides a pre-configured environment with strict architectural guardrails, a feature-ready Next.js admin frontend, and a high-performance Laravel backend with custom device authentication and domain-driven design.

**Initialization Command:**
```bash
# N/A - Foundation already initialized.
# Feature scaffolding will follow:
mkdir -p app/Domain/Analytics/{Actions,DTOs,Interfaces,Models,Resources}
mkdir -p admin/src/features/analytics/{api,components,hooks,types}
```

**Architectural Decisions Provided by Starter:**
- **Language & Runtime**: PHP 8.4 (Strict Types), TypeScript 5.x.
- **Styling Solution**: Tailwind CSS 4.x with `shadcn/ui` components.
- **Build Tooling**: Vite (Frontend), Composer (Backend).
- **Testing Framework**: PHPUnit (Backend), Vitest (Frontend).
- **Code Organization**: DDD + Strict Layered Architecture.

**Note:** Project initialization for this feature involves scaffolding the internal structures within the existing repo.

## Core Architectural Decisions

### Data Architecture
- **Decision**: **Relational Shadowing (Aggregate Tables)** for Customer Loyalty.
  - **Rationale**: Direct aggregation on 1M+ immutable `call_logs` is non-performant. We will use a dedicated `analytics_customer_loyalty` table updated via asynchronous events (`CallLogCreated`).
  - **Affects**: `app/Domain/Analytics/Models/CustomerLoyaltyMetrics.php`, `app/Domain/Calls/Listeners/UpdateLoyaltyMetrics.php`.
- **Decision**: **Database-backed System Settings**.
  - **Rationale**: Allows administrators to configure the `min_interaction_duration` threshold via the UI without code deployments.
  - **Affects**: `app/Domain/Settings/`, `app/Domain/Analytics/Actions/CalculateEngagementMetrics.php`.

### Authentication & Security
- **Decision**: **Laravel Sanctum (Admin-only)** [Starter Provided].
  - **Rationale**: Secure, token-based API authentication for the Next.js admin dashboard.
- **Decision**: **Custom Device Tokens (Devices-only)** [Starter Provided].
  - **Rationale**: Stateless, light-weight authentication for edge devices syncing logs.
- **Decision**: **SHA-256 Phone Hashing**.
  - **Rationale**: Maintain privacy governance by performing all analytics grouping and lookups on hashes rather than raw PII.

### API & Communication
- **Decision**: **RESTful Versioned API (`/api/v1/`)**.
  - **Rationale**: Predictable, standard-compliant communication between Next.js and Laravel.
- **Decision**: **DTO-First Data Flow**.
  - **Rationale**: Ensure strict typing and validation at the Service layer boundary.

### Frontend Architecture
- **Decision**: **TanStack Query (React Query) v5**.
  - **Rationale**: Handle caching, stale-time (5 min), and optimistic UI updates for the loyalty dashboard.
- **Decision**: **Feature-based Component Structure**.
  - **Rationale**: Organize analytics logic under `src/features/analytics/` following Next.js best practices.

---

## Implementation Patterns & Consistency Rules

### Naming Patterns
- **Database Conventions**:
    - Tables: `snake_case`, plural (e.g., `analytics_customer_loyalty`).
    - Columns: `snake_case` (e.g., `interaction_count`, `last_business_call_at`).
    - Foreign Keys: `admin_id`, `device_id` (consistent with existing schema).
- **API Conventions**:
    - Endpoints: Kebab-case, versioned (e.g., `/api/v1/admin/analytics/loyalty-report`).
    - Query Params: `snake_case` (e.g., `start_date`, `end_date`).
- **Code Conventions**:
    - Backend (PHP): PascalCase for Classes, camelCase for Methods.
    - Frontend (TS): PascalCase for Components/Types, camelCase for functions/variables.

### Structure Patterns
- **Domain-Driven Design (Backend)**:
    - All logic resides in `app/Domain/Analytics/`.
    - `Actions/`: Single-responsibility logic (e.g., `CalculateStickyIndexAction`).
    - `DTOs/`: Immutable data transfer objects for all cross-layer communication.
- **Feature-Based UI (Frontend)**:
    - All analytics UI resides in `src/features/analytics/`.
    - `api/`: Tanstack Query hooks and fetchers.
    - `components/`: UI-only primitives or feature-composed widgets.

### Format Patterns
- **API Responses**: Always wrap in standard Laravel API Resources.
- **Data Exchange**: JSON keys MUST be `snake_case`. Dates MUST be ISO 8601 strings.
- **Boolean States**: Use native `true`/`false` in JSON.

### Communication Patterns
- **Event-Driven Aggregation**: 
    - Event: `App\Domain\Calls\Events\CallLogCreated`.
    - Listener: `App\Domain\Analytics\Listeners\UpdateLoyaltyAggregate`.
    - Pattern: Aggregates are updated *after* the immutable log is persisted to ensure zero performance impact on device sync.

### Process Patterns
- **Error Handling**: Use the existing `ApiResponse` trait for consistent error/success structures.
- **Loading UI**: Use `Skeleton` loaders from `shadcn/ui` for all dashboard widgets while Tanstack Query is `isLoading`.

---

## Project Structure & Boundaries

### Complete Project Directory Structure (Feature Scaffolding)
```
/
├── app/
│   ├── Domain/
│   │   ├── Analytics/
│   │   │   ├── Actions/
│   │   │   │   ├── CalculateStickyIndexAction.php
│   │   │   │   └── GetLoyaltyReportAction.php
│   │   │   ├── DTOs/
│   │   │   │   └── LoyaltyReportQueryDTO.php
│   │   │   ├── Interfaces/
│   │   │   │   └── LoyaltyRepositoryInterface.php
│   │   │   ├── Listeners/
│   │   │   │   └── UpdateLoyaltyMetricsListener.php
│   │   │   ├── Models/
│   │   │   │   └── CustomerLoyaltyMetrics.php
│   │   │   └── Resources/
│   │   │       └── LoyaltyResource.php
│   │   ├── Calls/
│   │   │   └── Events/
│   │   │       └── CallLogCreated.php   <-- (Hook point)
│   │   └── Settings/
│   │       └── Models/
│   │           └── SystemSetting.php    <-- (For threshold config)
│   └── Http/
│       └── Controllers/
│           └── Api/V1/Admin/Analytics/
│               └── LoyaltyController.php
├── admin/src/features/analytics/
│   ├── api/
│   │   └── useLoyaltyReport.ts         <-- (Tanstack Query hook)
│   ├── components/
│   │   ├── LoyaltyDashboard.tsx       <-- (Container)
│   │   ├── StickyIndexChart.tsx       <-- (UI widget)
│   │   └── TopCustomersTable.tsx      <-- (UI widget)
│   ├── hooks/
│   │   └── useAnalyticsFilters.ts
│   └── types/
│       └── index.ts
└── database/migrations/
    └── xxxx_xx_xx_xxxxxx_create_analytics_customer_loyalty_table.php
```

### Architectural Boundaries

**API Boundaries:**
- **Endpoints**: `/api/v1/admin/analytics/loyalty-report` (GET)
- **Security**: Sanctum guarded, `AdminOnly` middleware.
- **Data Flow**: Controller -> Service (Contract) -> Action -> Model. Data always enters/leaves via DTOs/Resources.

**Data Boundaries:**
- **Aggregate Isolation**: The `analytics_customer_loyalty` table is a read-optimized "shadow" of the `call_logs` table.
- **Sync Pattern**: Asynchronous updates via Laravel events to prevent blocking call ingestion.
- **Config Bound**: Metrics calculation is bound by the `min_interaction_duration` setting from the `system_settings` table.

### Requirements to Structure Mapping

**Feature: Relationship & Loyalty Metrics**
- **FR1 (Sticky Index)**: Computed in `CalculateStickyIndexAction`, displayed in `StickyIndexChart.tsx`.
- **FR2 (Config Threshold)**: Fetched from `SystemSetting.php`, used in aggregation logic.
- **FR3 (Contact Recency)**: Tracked in `CustomerLoyaltyMetrics`, displayed in `TopCustomersTable.tsx`.
- **FR4 (Engagement Depth)**: Computed in `GetLoyaltyReportAction`.
- **FR5 (Top Customers)**: Sorted list from `CustomerLoyaltyMetrics`.

---

## Architecture Validation Results

### Coherence Validation ✅
- **Decision Compatibility**: Technology choices (Laravel 12, Next.js 15, PostgreSQL) are fully compatible and supported by the "CallTrack Enterprise Foundation".
- **Pattern Consistency**: The use of DDD on the backend and feature-based organization on the frontend ensures a clear separation of concerns and prevents implementation conflicts.
- **Structure Alignment**: The proposed directory structure directly supports the "relational shadowing" decision by providing specific locations for aggregate listeners and models.

### Requirements Coverage Validation ✅
- **Functional Requirements**: All metrics (Sticky Index, Recency, Depth, Efficiency) have mapped implementation points in the `Analytics` domain. Configurable duration threshold is handled via `SystemSettings`.
- **Non-Functional Requirements**: Performance (NFR1) is addressed via the aggregate table. Governance & Privacy (NFR2, NFR3) are enforced by using SHA-256 phone hashes for all aggregation keys.

### Implementation Readiness Validation ✅
- **Decision Completeness**: All core architectural decisions are documented.
- **Structure Completeness**: A complete file map for both backend and frontend has been provided.
- **Pattern Completeness**: Naming, communication (events), and process (loading/error) patterns are clearly defined.

### Gap Analysis Results
- **Critical Gaps**: None.
- **Important Gaps**: Detailed DTO field definitions for multi-manager filtering will be handled during the implementation of `LoyaltyReportQueryDTO`.

### Architecture Completeness Checklist
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Complete directory structure defined
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment
- **Overall Status**: **READY FOR IMPLEMENTATION**
- **Confidence Level**: **High**

**Key Strengths**:
- Sub-second dashboard performance due to relational shadowing.
- Strict privacy governance using hashed identifiers.
- Highly configurable via system settings.

**AI Agent Guidelines**:
- Follow the `app/Domain/Analytics` and `src/features/analytics` structure strictly.
- Ensure all business talk-time calculations exclude calls categorized as `Personal` or `Internal`.
- Use `Skeleton` loaders for a premium UI feel.

---

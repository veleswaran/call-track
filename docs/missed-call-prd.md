---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: brownfield
inputDocuments:
  - /home/z0401@ad.ziffity.com/Documents/training/php/calltrack/docs/brd.md
  - /home/z0401@ad.ziffity.com/Documents/training/php/calltrack/_bmad-output/planning-artifacts/product-brief-calltrack-2026-03-09.md
  - /home/z0401@ad.ziffity.com/Documents/training/php/calltrack/docs/ARCHITECTURE_QUICK_START.md
  - /home/z0401@ad.ziffity.com/Documents/training/php/calltrack/docs/DEVELOPMENT_FLOW.md
  - /home/z0401@ad.ziffity.com/Documents/training/php/calltrack/docs/WHY_THIS_ARCHITECTURE.md
workflowType: 'prd'
---

# Product Requirements Document - calltrack

**Author:** vignesh
**Date:** 2026-03-10

## Executive Summary

CallTrack AI acts as an immutable system of record for out-of-band sales and marketing phone channels. Built for Android-based field teams, it passively ingests all telephony activity without agent intervention. By separating governance data from raw ingestion, the platform ensures absolute visibility into team performance and guarantees that missed business calls never slip through the cracks. It provides administrators with a lightweight, filterable dashboard of escalation-eligible calls—categorized by team, agent, and date—and serves as a highly-auditable, API-ready data source for downstream CRM consumption.

### What Makes This Special

Unlike traditional CRMs that rely on manual logging or client-side categorization, CallTrack AI removes the agent from the data lifecycle. Logs are captured immediately upon call end and persist on the server even if deleted from the device. This "trust but verify" architecture shifts accountability from the individual to the system, automating escalation workflows based on configurable SLA response windows while maintaining a strict boundary between raw ingestion and administrative classification. 

## Project Classification

- **Project Type:** Web Application (Admin Dashboard & API Platform)
- **Domain:** General (Business Operations / Sales Monitoring)
- **Complexity Level:** Medium (Strict architectural guardrails, immutable event streams)
- **Project Context:** Brownfield (Enhancing MVP with Missed-Call Tracking & Engagement Analytics)

## Success Criteria

### User Success
For managers and administrators, success is achieved when the system reliably surfaces unattended business calls, enabling them to ensure follow-up. Success is defined as managers successfully verifying and acting upon **80%+ of escalation-eligible calls** (the specific target X% can be refined, but the key is the actionable follow-up).

### Business Success
The primary business outcome is a measurable reduction in the average percentage of unattended missed calls per day. The system must provide undeniable visibility into these gaps, directly supporting the goal of improving customer engagement and field team accountability.

### Technical Success
Technically, the system must accurately flag missed calls, calculate the `response_due_at` timestamp based on configurable organizational thresholds, and automatically resolve these escalations when a follow-up call occurs—all without relying on real-time streaming, thereby maintaining the established architecture. (Note: Specific schema implementation decisions, such as leveraging the existing `direction` field, will be validated during the Architecture review).

### Measurable Outcomes
- **Escalation Action Rate**: >80% of escalation-eligible calls are followed up on or resolved.
- **Unattended Call Reduction**: A week-over-week decrease in the average percentage of unattended missed calls per day.
- **System Accuracy**: 100% accurate identification of missed calls and correct `response_due_at` calculation.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** Problem-Solving Extension to an existing platform. We are building upon the current Next.js (Admin UI) and Laravel (Backend) MVP to introduce a dedicated Missed Call Insights page. The goal is rapid delivery of clear, actionable data to managers to reduce unattended calls.
**Resource Requirements:** Full-stack engineer(s) familiar with Laravel 12 (backend jobs, APIs) and React/Next.js (dashboard UI). 

### MVP Feature Set (Phase 1 / MVP-2 Extension)
**Core User Journeys Supported:**
- Regional Sales Manager tracking unattended calls via Dashboard (Primary)
- System Administrator configuring SLA rules (Operations)
- Field Agent indirectly triggering escalations/resolutions via Android app payload syncs

**Must-Have Capabilities:**
- **Missed Call Insights Page**: A new Next.js dashboard view for managers to see escalation-eligible calls.
- **Escalation & Auto-Resolve Engine**: Enhancements to the immutable data processing pipeline to flag missed calls via background jobs, evaluate simple "X hours from call" SLAs, and automatically resolve them when a follow-up call is detected.
- **Organization Settings UI**: Ability for admins to configure the X-hour threshold.

### Post-MVP Features
**Phase 2 (Growth / Advanced API):**
- **CRM API Integrations**: Securely exposing the REST endpoints for external CRM consumption.
- **Advanced SLA Logic**: Handling business hours, weekends, holidays, or timezone-specific SLA pausing.

**Phase 3 (Expansion):**
- **Automated Assignment Workflows**: The ability to automatically reassign unattended missed calls to an available team member or agent.
- **Agent Notifications**: Real-time push notifications sent directly to the agent's device.

### Risk Mitigation Strategy
**Technical Risks:** Accurately calculating SLAs via background jobs. Edge cases include: the device being offline and syncing logs late (e.g., syncing a missed call *after* the SLA has already breached), or syncing a follow-up call out of order.
**Mitigation:** The background job must evaluate strictly based on the immutable `timestamp` of the original call on the device, not the server ingestion time. Background jobs must be idempotent to handle late-arriving data correctly.
**Market Risks:** Managers ignoring the new page.
**Mitigation:** The UI must be lightweight and filterable by team to ensure high signal-to-noise ratio.
**Resource Risks:** Overcomplicating the frontend or SLA logic.
**Mitigation:** Sticking exclusively to standard shadcn/ui components in Next.js and simple 24/7 "X hour" math for the MVP.

## User Journeys

### 1. Sarah, the Regional Sales Manager (Primary User - Success Path)
* **Situation:** Sarah manages 15 field agents. She's frustrated because she suspects important client calls are slipping through the cracks, but has no data to prove it.
* **Journey:** Over morning coffee, she logs into the dashboard, sets the filter to "Yesterday", and clicks "Escalation-Eligible". The system highlights 3 missed calls for her team that exceeded the 2-hour SLA. She messages the responsible agent. The agent calls the client back, the system detects this follow-up call, and automatically marks the escalation as "Resolved."

### 2. Alex, the System Administrator (Operations - Configuration Path)
* **Situation:** Alex handles org-wide settings and needs to adjust rules to fit evolving business needs.
* **Journey:** Alex logs into the org settings. He accesses the "Missed Call Rules" section and updates the response threshold from 2 hours to 4 hours to reflect a new company policy. He also sets the automatic resolution window to 24 hours. The system immediately applies these new SLA rules to all future incoming missed calls.

### 3. Automated CRM Service (API Integration User)
* **Situation:** The company's external CRM needs to know about escalated calls to trigger internal alerts.
* **Journey:** The CRM runs an hourly sync, calling the `GET /api/v1/call-logs?escalation=1` endpoint securely using a token. It receives a structured JSON payload of unattended calls, which it uses to automatically create "High Priority Tasks" in the CRM for the respective account executives.

### 4. David, the Field Agent (Edge Case / Trigger User)
* **Situation:** David is driving and rejects an incoming client call, intending to call back later, but forgets.
* **Journey:** The Android app syncs the rejected call to the server as `missed = true`. The system starts the SLA timer. Because David forgets, the SLA breaches and the call becomes `escalated`. After his manager intervenes, David makes the follow-up call. The app immediately logs the outgoing call, and the server's background job detects it and resolves the escalation automatically.

### Journey Requirements Summary
- Dashboard UI with team-based filtering and escalation status visibility
- Organization-level settings management for configuring SLA thresholds
- Secured REST API with authentication and escalation-specific filtering for downstream CRM consumption
- Background job processing for automated rule evaluation and SLA calculations

## Web Application & API Requirements

### Project-Type Overview
CallTrack AI is structured as an API-first backend (Laravel 12) serving a decoupled Single Page Application (Next.js) administrative frontend, as well as downstream REST API consumers (CRMs).

### Technical Architecture Considerations
- **Architecture Standard:** Strict adherence to the "Antigravity Standard" (Controllers -> Services [Contracts] -> Actions -> Models -> Domain Events).
- **Frontend App:** Next.js App Router acting as the sole UI consumer for administrative tasks. No Laravel Blade or Inertia views.
- **Data Flow:** All cross-layer communication must use immutable Data Transfer Objects (DTOs).

### API & Endpoint Specifications
- **Versioning:** All APIs must be versioned under `/api/v1`.
- **Response Format:** Strict usage of Laravel API Resources for all responses (never return raw Eloquent models).
- **Pagination:** Mandatory pagination for list endpoints (e.g., `/api/v1/call-logs?escalation=1`).

### Authentication & Authorization Model
- **Admin Auth:** Cookie-based authentication via Laravel Sanctum (v4) for the Next.js frontend.
- **API Token Auth:** Stateful tokens for downstream systems (CRM integration).
- **Permissions:** Role-Based Access Control (RBAC) enforced via Policies/FormRequests. "Managers see these records only for agents in their teams".
- **Multi-Tenancy:** The data model will remain "multi-tenant ready", but strict logical tenant isolation is deferred to a later phase (Out of Scope for MVP-2).

### Performance & Processing
- **Queueing:** Escalation SLA timing and automated resolution logic operate via scheduled/background jobs. Real-time streaming or WebSocket (Reverb) integrations are explicitly excluded.
- **Performance Budget:** Endpoints serving the dashboard must respect the strict limit of ≤10 queries per request (N+1 queries strictly forbidden).

## Functional Requirements (MVP-2 Capabilities)

*(Note: Assumes User Auth, App Ingestion, and Base Settings are already implemented in the core platform.)*

### 1. Escalation & SLA Management
- FR1: The System can automatically calculate an escalation timestamp (`response_due_at`) for every incoming missed call based on configured organization SLA rules.
- FR2: The System can evaluate SLA timers in the background and flag calls as `escalated` once the threshold is breached.
- FR3: The System can correlate outgoing follow-up calls to prior missed calls from the same client number.
- FR4: The System can automatically mark an `escalated` or `missed` call as `resolved` when a qualifying follow-up call is detected.

### 2. Missed Call Insights Dashboard
- FR5: Managers can view a paginated list of all missed, pending, and escalated calls for their assigned agents.
- FR6: Managers can view the real-time escalation status (e.g., Pending, Escalated, Resolved) for any missed call.
- FR7: Managers can filter the insights list by specific date ranges.
- FR8: Managers can filter the insights list by specific teams or individual agents under their purview.

### 3. CRM API Integration
- FR9: External Systems can fetch a paginated list of call logs strictly filtered by escalation status.
- FR10: External Systems can retrieve the `resolved` state of previously escalated calls to close out external tasks.

### 4. Configuration Updates
- FR11: Administrators can configure the default SLA response time threshold (e.g., "X hours") specifically for missed calls within the existing settings interface.

## Non-Functional Requirements

### Performance & Processing Latency
- NFR1: Background queue processing must calculate and tag escalations within 15 minutes of an SLA breach occurring.
- NFR2: Dashboards must query and load escalation insights in < 2.0 seconds for a manager viewing 30 days of historical data.

### Data Integrity & Idempotency
- NFR3: The escalation calculation and resolution jobs must be 100% idempotent. If an agent's phone is offline for multiple days and batch-syncs a missed call alongside its subsequent follow-up call simultaneously, the system must correctly evaluate their device timestamps and parse the resolution without triggering false-positive alerts or SLA breach artifacts.

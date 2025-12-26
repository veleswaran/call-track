---
trigger: always_on
glob:
description:
---
0. Purpose

This document defines the mandatory architectural, coding, testing, security, and behavioral rules for AI agents working on the Next.js Admin Frontend of CallTrack AI.

❗ If any rule is violated, the implementation is incorrect, even if it “works”.

Primary goals:

Predictable AI-generated UI code

Enterprise scalability

Secure backend integration

Mobile-first, PWA-friendly UX

Long-term maintainability

1. Foundational Context

This is a Next.js enterprise admin application using:

Next.js App Router

TypeScript strict mode

React 18+

shadcn/ui + Tailwind CSS

TanStack Query (React Query)

Vitest for unit tests

Playwright (future E2E)

AWS Amplify for hosting

AI agents are assumed to be experts in all listed tools.

2. Core Architectural Guardrails (Hard Rules)

2.1 Dependency Direction (MANDATORY)

Route (page.tsx)
   ↓
Feature Container
   ↓
Hooks (data orchestration)
   ↓
API Services


Forbidden:

Pages calling fetch() directly

Components calling backend APIs

UI components importing services

Hooks containing UI logic

2.2 Feature-Based Structure (MANDATORY)

Code MUST be organized by domain feature, not by type.

src/
 ├── app/
 ├── features/
 │   ├── dashboard/
 │   ├── call-logs/
 │   ├── devices/
 │   ├── agents/
 │   └── auth/
 ├── shared/
 │   ├── components/
 │   ├── hooks/
 │   ├── api/
 │   ├── types/
 │   └── utils/


Forbidden:

components/, hooks/, services/ at root without feature grouping

2.3 Server vs Client Boundary (CRITICAL)

Server Components → layout, routing, static data

Client Components → interactivity, forms, charts

Rules:

use client only when required

No business logic in Server Components

No API secrets in Client Components

3. UI Component Rules (shadcn Standard)

3.1 Component Classification

Component Type

Responsibility

UI Component

Pure presentation

Feature Component

Composes UI + hooks

Container

Handles state & orchestration

Forbidden:

UI components with API logic

UI components managing global state

3.2 shadcn Usage Rules

Use shadcn components as base primitives

Extend using Tailwind only

Do NOT modify shadcn internals

Do NOT wrap shadcn unnecessarily

4. API & Security Rules (NON-NEGOTIABLE)

4.1 Backend Integration

All backend access goes through:

src/shared/api/


Use fetch wrappers only

No raw fetch() outside API services

4.2 Authentication & Security

Sanctum cookie-based auth

credentials: 'include' for requests

CSRF-safe headers

No tokens stored in localStorage

Automatic logout on 401

4.3 API Versioning

All backend calls must target:

/api/v1


5. Data Management Rules (TanStack Query)

React Query handles:

Caching

Refetching

Loading/error states

No global state duplication

Queries must be keyed by domain intent

Forbidden:

Manual loading flags

Derived business logic on frontend

6. Testing Rules (Vitest – Non-Negotiable)

6.1 Required Test Coverage

Layer

Test Type

Hooks

Unit

API services

Unit

Feature components

Unit

Shared utilities

Unit

Rules:

Mock backend APIs

No snapshot-only tests

Tests must assert behavior

No test deletion without approval

7. Performance Rules

Route-based code splitting

Lazy load charts and heavy components

Avoid unnecessary re-renders

Memoization only when justified

8. Accessibility & UX Rules

Keyboard navigation required

ARIA roles for interactive elements

Mobile-first breakpoints

Touch-friendly hit areas

9. PWA & Mobile Rules

Manifest.json required

Icons for all sizes

Offline fallback page

No background sync assumptions yet

10. Environment & Config Rules

No process.env usage outside config layer

Public env vars must be prefixed with NEXT_PUBLIC_

Backend base URL via config only

11. TypeScript Rules (STRICT)

No any

No implicit any

Explicit return types

Shared API response types

12. AI Behavioral Constraints (CRITICAL)

AI MUST:

Ask clarifying questions if API shape is unclear

Respect feature boundaries

Follow existing patterns

Assess impact before changes

AI MUST NOT:

Invent new architectural layers

Bypass hooks/services

Hardcode backend assumptions

Add unnecessary libraries

13. Golden Rule

If another AI agent cannot safely extend this UI in 6 months without refactors, the implementation is incorrect.

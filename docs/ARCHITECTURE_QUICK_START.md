# Architecture Quick Start 🚀

## 🏗 The Big Picture
**CallTrack AI** is an API-first platform. We prioritize **maintainability**, **testability**, and **strict boundaries** over development speed.

> "If the code cannot scale, be audited, tested, extended, and safely modified by another AI agent in 6 months, it is incorrect."

---

## 🧩 Key Concepts

### 1. Layers
We separate concerns strictly.
- **Web Layer (`Controllers`, `Requests`, `Resources`)**: Handles HTTP. *Validation, Authorization, Response Formatting.* **No Logic.**
- **Service Layer (`Services`, `Contracts`)**: Orchestrates work. *Transaction management, connecting multiple actions.*
- **Domain Layer (`Actions`, `DTOs`)**: Pure business logic. *Updates DB, calculations, rules.*
- **Data Layer (`Models`)**: Database interaction. *Relationships, Scopes.*

### 2. Dependency Direction
Dependencies MUST flow one way:
`HTTP` ➡️ `Service` ➡️ `Action` ➡️ `Model`

### 3. Data Transfer
We explicitly define data structures.
- **DTOs**: Data moving *into* the system (Controller ➡️ Service).
- **Resources**: Data moving *out* of the system (Controller ➡️ User).

---

## 📂 Folder Structure Map

| Directory | Purpose |
| :--- | :--- |
| `app/Actions` | Single-purpose classes doing *one* thing (e.g., `CreateUserAction`). |
| `app/Contracts` | Interfaces for Services. Controllers *only* talk to these. |
| `app/DTOs` | Typed data containers. No logic. |
| `app/Http/Controllers` | "Skinny" endpoints. Validates input, calls service, returns resource. |
| `app/Http/Requests` | Validation rules for incoming data. |
| `app/Http/Resources` | JSON transformers for API responses. |
| `app/Services` | Orchestrators implementing Contracts. |
| `database/migrations` | Schema definitions. |
| `tests/Feature` | Tests for Controllers (e.g., "Can a user log in?"). |
| `tests/Unit` | Tests for Actions/Services (e.g., "Does calculation X work?"). |

---

## 🚦 Do's and Don'ts

| ✅ DO | ❌ DON'T |
| :--- | :--- |
| Use `FormRequest` for validation | Validate in Controller |
| Pass `DTO` to Service | Pass `Request` or `array` to Service |
| Use `Action` for business logic | Put logic in Model or Controller |
| Type-hint Interfaces | Type-hint Concrete Classes in Controllers |
| Return `ApiResource` | Return `Model` or `array` |

---

## 📚 Where to go next?
- **[Development Flow](/docs/DEVELOPMENT_FLOW.md)**: Step-by-step guide to adding a feature.
- **[Git Hooks](/docs/GIT_HOOKS.md)**: How we keep code clean automatically.

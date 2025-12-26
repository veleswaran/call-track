# CallTrack AI

CallTrack AI is an API-first enterprise platform designed to capture, classify, and analyze call logs from registered Android devices. It features strict immutability for raw data logs and a separate governance layer for business logic.

## 🚀 Features

- **Immutable Ingestion**: Raw call logs are hashed and stored with strict immutability.
- **Device Authentication**: Stateless, token-based authentication for devices (`X-Device-Token`).
- **Admin Governance**: Laravel Sanctum-based admin API for classifying calls (Business/Personal/Ignored).
- **Sales Agent Tagging**: Assign devices to sales agents for CRM attribution and analytics.
- **Analytics**: Async job processing for daily call statistics.
- **Domain-Driven Design**: Clean architecture separating Domains, Actions, and Services.
- **API Documentation**: Auto-generated OpenAPI documentation via Dedoc Scramble.

## 🛠️ Tech Stack

- **Framework**: Laravel 12+
- **PHP**: 8.4+
- **Database**: PostgreSQL / MySQL (Tested with SQLite for Dev)
- **Auth**: Laravel Sanctum (Admins), Custom Tokens (Devices)
- **Documentation**: Dedoc Scramble

## 📂 Project Structure

We follow a Domain-Driven Design (DDD) approach:

```
app/
├── Domain/           # Eloquent Models & DTOs (e.g., Calls, Devices)
├── Actions/          # Atomic business logic units
├── Services/         # Orchestration layer (using Contracts)
├── Http/Controllers  # Skinny controllers handling transport only
└── Jobs/             # Async processing (Analytics)
```

## ⚡ API Documentation

API documentation is automatically generated.

- **URL**: `/docs/api`
- **Format**: OpenAPI (Stoplight Elements UI)

### Key Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/devices/register` | Register a new device | None |
| `POST` | `/api/v1/call-logs/bulk` | Ingest batched call logs | Device Token |
| `POST` | `/api/v1/admin/calls/{id}/classify` | Classify a call log | Admin (Sanctum) |
| `POST` | `/api/v1/admin/agents` | Create a sales agent | Admin (Sanctum) |
| `GET` | `/api/v1/admin/agents` | List all agents | Admin (Sanctum) |
| `PUT` | `/api/v1/admin/agents/{id}` | Update agent details | Admin (Sanctum) |
| `POST` | `/api/v1/admin/devices/{id}/assign-agent` | Assign agent to device | Admin (Sanctum) |
| `POST` | `/api/v1/admin/devices/{id}/unassign-agent` | Unassign agent from device | Admin (Sanctum) |

## 📦 Setup Instructions

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Migration**
   ```bash
   php artisan migrate
   ```

4. **Serve Application**
   ```bash
   php artisan serve
   ```

## 🧪 Quality Assurance

Ensure code quality and architectural compliance using the following tools:

### 1. Unit & Feature Tests
Run the full test suite (100% coverage on business logic):
```bash
php artisan test
```

### 2. Static Analysis (Larastan)
We use PHPStan (Level 5+) to enforce strict typing and catch bugs early:
```bash
./vendor/bin/phpstan analyse
```

### 3. Code Style (Laravel Pint)
Automatically fix code style issues to follow PSR-12 and Laravel best practices:
```bash
./vendor/bin/pint
```


## 🔒 Security

- **Device Tokens**: Devices authenticate using long-lived `X-Device-Token` headers.
- **Admin Access**: Standard Bearer token authentication via Sanctum.

---
**CallTrack AI** — *Enterprise Call Analytics Platform*

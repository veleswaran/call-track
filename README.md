# CallTrack AI

CallTrack AI is an API-first enterprise platform designed to capture, classify, and analyze call logs from registered Android devices. It features strict immutability for raw data logs and a separate governance layer for business logic.

## 🚀 Features

- **Immutable Ingestion**: Raw call logs are hashed and stored with strict immutability.
- **Device Authentication**: Stateless, token-based authentication for devices (`X-Device-Token`).
- **Admin Governance**: Laravel Sanctum-based admin API for classifying calls (Business/Personal/Ignored).
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
| `POST` | `/api/v1/call-logs/bulk` | Ingest batched call logs | Device Token |
| `POST` | `/api/v1/admin/calls/{id}/classify` | Classify a call log | Admin (Sanctum) |

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

## 🧪 Testing

Run strict tests to ensure architecture compliance:

```bash
php artisan test
```

## 🔒 Security

- **Device Tokens**: Devices authenticate using long-lived `X-Device-Token` headers.
- **Admin Access**: Standard Bearer token authentication via Sanctum.

---
**CallTrack AI** — *Enterprise Call Analytics Platform*

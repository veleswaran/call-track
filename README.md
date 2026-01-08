# CallTrack AI

CallTrack AI is an API-first enterprise platform designed to capture, classify, and analyze call logs from registered Android devices. It features strict immutability for raw data logs and a separate governance layer for business logic.

## 🚀 Features

- **Immutable Ingestion**: Raw call logs are hashed and stored with strict immutability.
- **Device Authentication**: Stateless, token-based authentication for devices (`X-Device-Token`).
- **Two-Factor Authentication**: Secure admin access with TOTP-based 2FA.
- **Admin Governance**: Laravel Sanctum-based admin API for classifying calls (Business/Personal/Ignored).
- **Sales Agent Tagging**: Assign devices to sales agents for CRM attribution and analytics.
- **Device Registration Codes**: Generate time-limited one-time codes for agent device registration.
- **SIM Slot Filtering**: Track calls only from specific SIM slots (e.g. Work SIM).
- **Agent Classification**: Agents can classify calls and add notes directly from the device.
- **Server-Side UUIDs**: Privacy-first device registration where the server creates and manages unique device IDs.
- **Battery Tracking**: Real-time battery level monitoring during call log syncs.
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

- URL: `/docs/api`
- Format: OpenAPI (Stoplight Elements UI)

Note: Access to docs is gated by `Gate::define('viewApiDocs', ...)`. In this repo it is open for convenience in `AppServiceProvider::boot()`. Restrict it in production.

### Key Endpoints (v1)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/devices/register` | Register a new device | None |
| `POST` | `/api/v1/call-logs/sync` | Ingest batched call logs | Device Token |
| `POST` | `/api/v1/calls/{hash}/classify` | Classify/Note a call from device | Device Token |
| `GET` | `/api/v1/admin/dashboard` | Analytics Dashboard | Admin (Sanctum) |
| `GET` | `/api/v1/admin/call-logs` | List paginated call logs | Admin (Sanctum) |
| `POST` | `/api/v1/admin/calls/{id}/classify` | Classify a call log | Admin (Sanctum) |
| `GET` | `/api/v1/admin/contacts` | List saved contacts | Admin (Sanctum) |
| `POST` | `/api/v1/admin/contacts` | Create/update a contact | Admin (Sanctum) |
| `GET` | `/api/v1/admin/agents` | List all agents | Admin (Sanctum) |
| `POST` | `/api/v1/admin/agents` | Create a sales agent | Admin (Sanctum) |
| `PUT` | `/api/v1/admin/agents/{id}` | Update agent details | Admin (Sanctum) |
| `POST` | `/api/v1/admin/devices/codes` | Generate registration code | Admin (Sanctum) |
| `POST` | `/api/v1/admin/devices/{id}/assign-agent` | Assign agent to device | Admin (Sanctum) |
| `POST` | `/api/v1/admin/devices/{id}/unassign-agent` | Unassign agent from device | Admin (Sanctum) |
| `API` | `/api/v1/admin/users` | Admin User Management (resource) | Admin (Sanctum) |
| `POST` | `/api/v1/auth/two-factor/*` | 2FA Management (enable, confirm, etc.) | Admin (Sanctum) |

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

4. **Create Super Admin**
   ```bash
   php artisan admin:create-super
   ```

5. **Serve Application**
   ```bash
   php artisan serve
   ```

6. **Admin (Next.js) Dev Server**
   ```bash
   cd admin
   pnpm install # or npm/yarn
   pnpm dev
   ```
   - Configure the backend base URL via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).
   - Admin uses Sanctum cookie-based auth in the browser; for curl/manual API calls, use Bearer tokens.

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
- **Two-Factor Authentication**: Admins can enable 2FA for enhanced account security.

## 🔗 Admin vs Device API — Auth and cURL recipes

The platform exposes two distinct surfaces:

- Device ingestion API (stateless): Authenticate with `X-Device-Token` header
- Admin API (Laravel Sanctum): Authenticate with `Authorization: Bearer <token>` for curl/automation, or cookie-based auth in the Admin UI

### Device: Register a device

```bash
curl --request POST \
  --url 'http://127.0.0.1:8000/api/v1/devices/register' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
    "code": "YOUR_REGISTRATION_CODE",
    "device_uuid": "OPTIONAL_CLIENT_PROVIDED_UUID",
    "device_name": "Pixel 7",
    "os_version": "14",
    "app_version": "1.0.0",
    "tracked_sim_slots": [0, 1]
  }'
```

Response includes a `device_token` and the assigned `device_uuid` (generated by server if not provided). Use `device_token` in valid API calls, and persist `device_uuid` locally if needed.

### Device: Sync call logs

```bash
curl --request POST \
  --url 'http://127.0.0.1:8000/api/v1/call-logs/sync' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'X-Device-Token: YOUR_DEVICE_TOKEN' \
  --data '{
    "battery_level": 85,
    "logs": [
      {
        "call_id": "1699999999999-0001",
        "number": "+15551234567",
        "direction": "outgoing",
        "duration": 42,
        "timestamp": "2025-12-29T10:15:00Z"
      }
    ]
  }'
```

### Device: Classify Call

```bash
curl --request POST \
  --url 'http://127.0.0.1:8000/api/v1/call-logs/YOUR_CALL_HASH/classify' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'X-Device-Token: YOUR_DEVICE_TOKEN' \
  --data '{
    "type": "BUSINESS",
    "note": "Client inquiry about pricing"
  }'
```

### Admin: List call logs

```bash
curl --request GET \
  --url 'http://127.0.0.1:8000/api/v1/admin/call-logs?per_page=25&page=1' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer YOUR_SANCTUM_TOKEN'
```

Response fields include `contact_name` and `contact_notes` when the phone number matches a saved contact. These are injected server-side without extra queries per row (batched enrichment + short TTL cache).

### Admin: List contacts

```bash
curl --request GET \
  --url 'http://127.0.0.1:8000/api/v1/admin/contacts?per_page=20&page=1' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer YOUR_SANCTUM_TOKEN'
```

### Admin: Create/update contact

```bash
curl --request POST \
  --url 'http://127.0.0.1:8000/api/v1/admin/contacts' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_SANCTUM_TOKEN' \
  --data '{
    "device_id": 1,
    "name": "Ada Lovelace",
    "phone_number": "+15551234567"
  }'
```

### How to get `YOUR_SANCTUM_TOKEN` quickly (local/dev)

```bash
php artisan tinker
```

```php
$user = \App\Models\User::first();
$token = $user->createToken('admin-api')->plainTextToken; $token;
```

Use the printed string as the Bearer token in curl.

## ⚙️ Performance & Caching (Call Logs → Contacts enrichment)

To avoid N+1 lookups when listing call logs, the server batches phone hashes for the current page and fetches related contacts once. A lightweight cache stores the contact map briefly.

- Configuration: `config('cache.ttl_contacts_map', 60)` (seconds). Set to `0` to effectively disable.
- Future optimization: Persist `phone_hash` on `call_logs` and index both tables to enable DB-level joins.

---
**CallTrack AI** — *Enterprise Call Analytics Platform*

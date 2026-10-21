# CallTrack AI - Express.js + MongoDB Backend API

This is the **Express.js (TypeScript) + MongoDB (Mongoose)** backend for **CallTrack AI**, designed as a high-performance, enterprise-grade replacement for the Laravel backend.

## 🚀 Features

- **Strict Immutability**: Call logs are indexed by unique SHA256 hashes (`callHash`), insert-only, and idempotent.
- **Stateless Device Authentication**: Validates Android devices using `X-Device-Token` header.
- **Admin Authentication**: JWT + Cookie session authentication, fully compatible with Laravel Sanctum frontend conventions (`/sanctum/csrf-cookie`, `/login`, `/logout`, `/api/user`).
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) with QR code setup, verification challenge, and recovery codes.
- **Call Escalations & SLAs**: Tracks missed calls, automatic 15-minute response due windows, and resolution when an outbound connected call occurs.
- **Comprehensive Admin & Reporting APIs**:
  - Analytics Dashboard metrics & charts
  - Day-wise and Agent Performance reports
  - Call logs filtering, search, and CSV export
  - Escalation insights & CSV export
  - Sales Agent and Team management
  - Device registration codes & remote event tracking
  - Contact management & CSV import
  - System settings and branding logo upload

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+ (Node 22 tested)
- **Language**: TypeScript (Strict Mode)
- **Framework**: Express 4
- **Database**: MongoDB via Mongoose 8
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Validation**: Zod
- **2FA**: `speakeasy` & `qrcode`

## 📂 Project Structure

```
server/
├── src/
│   ├── config/          # Environment & MongoDB connection setup
│   ├── models/          # Mongoose schemas (User, Agent, Device, CallLog, Escalation, etc.)
│   ├── middleware/      # Auth, DeviceAuth, Role, Error Handling
│   ├── controllers/     # Handlers for all routes
│   ├── routes/          # Express API routes (/api/v1/...)
│   ├── utils/           # Response helpers, hashing, TOTP, CSV generators
│   ├── scripts/         # Database seeder (seed.ts)
│   ├── app.ts           # Express application setup & middleware
│   └── index.ts         # Server entrypoint
├── package.json
└── tsconfig.json
```

## ⚙️ Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (already created with default development values):
```bash
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/calltrack
JWT_SECRET=super-secret-jwt-key-for-calltrack-dev-only-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
ADMIN_EMAIL=admin@calltrack.test
ADMIN_PASSWORD=password
```

### 3. Seed Database
Seed the database with the initial Administrator account (`admin@calltrack.test` / `password`), system settings, and sample agent/team:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

The server will listen at `http://localhost:8000`.

### 5. Start Next.js Frontend
```bash
cd ../admin
npm run dev
```
Open `http://localhost:3000` to log in with `admin@calltrack.test` and `password`.

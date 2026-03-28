# 🚀 Master Deployment Guide: CallTrack AI on Coolify

A complete, step-by-step workflow to deploy **CallTrack AI** (Laravel + Next.js) on Coolify using a **Single Domain Strategy** (`calltrack.axninfotech.com`).

**Pre-requisites:**

- A Coolify Server running the latest version.
- Access to the GitHub repository: `altalya/calltrack`.
- SSH Key configured for private repository access (if applicable).

---

## Phase 1: Push Code to GitHub (Local)

Before deploying, ensure your latest local code is on GitHub.

1.  **Check Status**:
    ```powershell
    git status
    ```
2.  **Add & Commit**:
    ```powershell
    git add .
    git commit -m "Prepare for deployment"
    ```
3.  **Push**:
    ```powershell
    git push origin main
    ```

---

## Phase 2: Configure Access in Coolify (SSH/Deploy Keys)

_If your repository is **Private**, you must allow Coolify to access it._

1.  Go to **Coolify dashboard**.
2.  Navigate to **Keys & Tokens** (or "Private Keys" on older versions).
3.  **Add Private Key**:
    - Name: `github-deploy-key`
    - Value: Your private SSH key (usually `id_rsa`).
    - _Alternatively, use the "Git Source" integration in Coolify to authorize via OAuth._
4.  If manually adding a key, ensure the corresponding **Public Key** is added to your **GitHub Repository -> Settings -> Deploy Keys**.

---

## Phase 3: Create Database (PostgreSQL)

1.  Go to your Project in Coolify.
2.  Click **+ New** -> **Database** -> **PostgreSQL**.
3.  **Configure**:
    - **Name**: `calltrack-db`
    - **Version**: 15+ (Recommended)
4.  **Start** the database.
5.  **Copy Secrets**:
    - Note the **Internal Connection Details**: `Host`, `Port`, `User`, `Password`, `Database`.

---

## Phase 4: Backend Deployment (Laravel API)

### 1. Create Resource

1.  **New** -> **Source** (GitHub/GitLab).
2.  Select Repo: `altalya/calltrack`.
3.  **Configuration**:
    - **Branch**: `main`
    - **Build Pack**: `Nixpacks`
    - **Base Directory**: `/`

### 2. Domain & Routing

_Goal: Route `/api` and `/sanctum` traffic to Laravel._

Set **Domains** to exactly:

```text
https://calltrack.axninfotech.com/api,https://calltrack.axninfotech.com/sanctum,https://calltrack.axninfotech.com/up,https://calltrack.axninfotech.com/storage
```

### 3. Environment Variables

Add these to the Backend resource:

```env
APP_NAME=CallTrack
APP_ENV=production
APP_DEBUG=false
APP_URL=https://calltrack.axninfotech.com

# Database (Use Internal Details from Phase 3)
DB_CONNECTION=pgsql
DB_HOST=calltrack-db
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=<paste-password-here>

# Auth & Cookies (Shared Domain)
SESSION_DOMAIN=calltrack.axninfotech.com
SANCTUM_STATEFUL_DOMAINS=calltrack.axninfotech.com
CORS_ALLOWED_ORIGINS=https://calltrack.axninfotech.com

# Security
APP_KEY=base64:<run-php-artisan-key:generate-locally-and-paste-here>
```

### 4. Build Configuration (Crucial)

Enter these commands in the **Build** tab:

- **Install Command**:

    ```bash
    npm install --include=dev && composer install --no-dev --optimize-autoloader
    ```

    _(Note: `npm install --include=dev` is required to ensure `vite` is available for the build step)_

- **Build Command**:

    ```bash
    npm run build
    ```

- **Start Command**:
    ```bash
    php artisan serve --host=0.0.0.0 --port=80
    ```

### 5. Post-Deployment Command

In the **General** tab:

```bash
php artisan migrate --force && php artisan storage:link && php artisan config:cache && php artisan route:cache && php artisan view:cache
```

### 6. Deploy

Click **Deploy**.

---

## Phase 5: Frontend Deployment (Next.js)

### 1. Create Resource

1.  **New** -> **Source** -> `altalya/calltrack` (Same share).
2.  **Configuration**:
    - **Base Directory**: `/admin` <-- **CRITICAL**
    - **Build Pack**: `Nixpacks`

### 2. Domain Configuration

Set **Domains** to exactly:

```text
https://calltrack.axninfotech.com
```

### 3. Environment Variables

```env
# Point to the root domain. The code automatically appends /api/v1.
NEXT_PUBLIC_API_URL=https://calltrack.axninfotech.com
```

### 4. Build Configuration

Enter these commands in the **Build** tab:

- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 5. Deploy

Click **Deploy**.

---

## Phase 6: Final Verification

1.  **Wait** for both deployments to show "Healthy".
2.  **Visit** `https://calltrack.axninfotech.com`.
    - If you see the Admin Login -> **Frontend is working**.
3.  **Test API**: Visit `https://calltrack.axninfotech.com/api/user`.
    - If you see `{"message": "Unauthenticated."}` (JSON) -> **Backend is working**.
    - If you see a 404 Next.js page -> **Backend Routing is wrong** (Check Phase 4, Step 2).

### Troubleshooting SSH/Git

- If Coolify fails to clone:
    - Check **Settings -> Keys & Tokens** in Coolify.
    - Verify the **Deploy Key** in GitHub Settings.
    - Ensure the repository URL is correct (SSH format `git@github.com:...` is preferred if using keys).

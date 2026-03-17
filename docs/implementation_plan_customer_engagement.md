# Implementation Plan: Relationship & Loyalty Metrics

This plan outlines the implementation of a new customer analytics dashboard to measure engagement metrics (Sticky Index, Recency, Depth) using highly optimized data paths.

## Proposed Changes

### 1. Database & Domain Models (Backend)

We will use **Relational Shadowing** to ensure sub-second response times on the analytics dashboard without stressing the primary `call_logs` table.

#### [NEW] [create_analytics_customer_loyalty_table.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/database/migrations/xxxx_xx_xx_xxxxxx_create_analytics_customer_loyalty_table.php)
- Define `analytics_customer_loyalty` table:
    - `phone_hash` (string, unique index): The primary key for analytics (SHA-256).
    - `interaction_days` (jsonb): A list of unique dates the customer interacted.
    - `sticky_index` (integer): Count of unique interaction days.
    - `last_business_interaction_at` (timestamp): Recency tracking.
    - `total_business_duration` (integer): Total talk-time in seconds.
    - `total_business_calls` (integer): Frequency count.
    - `timestamps`.

#### [NEW] [CustomerLoyaltyMetrics.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Analytics/Models/CustomerLoyaltyMetrics.php)
- Eloquent model for the aggregate table.
- Casts for `interaction_days` as array and `last_business_interaction_at` as datetime.

---

### 2. Event-Driven Aggregation (Backend)

#### [NEW] [UpdateLoyaltyMetricsListener.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Analytics/Listeners/UpdateLoyaltyMetricsListener.php)
- Subscribes to `App\Domain\Calls\Events\CallLogCreated`.
- Logic:
    1. Check if call classification is `Business` (or null, assuming default).
    2. Retrieve `min_interaction_duration` from `SystemSetting`.
    3. Determine if it's a valid "Interaction" (Outgoing OR Incoming > threshold).
    4. Upsert `analytics_customer_loyalty` for the `phone_hash`.

---

### 3. Business Logic & API (Backend)

Following the **Antigravity Standard** (Controller -> Service -> Action).

#### [NEW] [LoyaltyReportQueryDTO.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Analytics/DTOs/LoyaltyReportQueryDTO.php)
- Immutable DTO for filtering (date range, agent, etc.).

#### [NEW] [GetLoyaltyReportAction.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Analytics/Actions/GetLoyaltyReportAction.php)
- Query the `CustomerLoyaltyMetrics` model based on DTO filters.
- Returns a collection of calculated engagement metrics.

#### [NEW] [LoyaltyController.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Http/Controllers/Api/V1/Admin/Analytics/LoyaltyController.php)
- Endpoint: `GET /api/v1/admin/analytics/loyalty-report`.
- Authorize as `Admin`.
- Call `GetLoyaltyReportAction`.

#### [NEW] [LoyaltyResource.php](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/app/Domain/Analytics/Resources/LoyaltyResource.php)
- Standardize the JSON response for the frontend.

---

### 4. Admin Frontend (Next.js)

#### [NEW] [useLoyaltyReport.ts](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/admin/src/features/analytics/api/useLoyaltyReport.ts)
- Tanstack Query fetcher with 5-minute stale-time.

#### [NEW] [LoyaltyDashboard.tsx](file:///home/z0401@ad.ziffity.com/Documents/training/php/calltrack/admin/src/features/analytics/components/LoyaltyDashboard.tsx)
- Main container layout for Relationship & Loyalty metrics.

---

## Verification Plan

### Automated Tests (Backend)

#### Unit Tests
- `php artisan test --filter=UpdateLoyaltyMetricsListenerTest`: Verify that the listener correctly updates aggregates for varied call durations (below/above threshold).
- `php artisan test --filter=CalculateStickyIndexActionTest`: Verify the index calculation logic (unique days counting).

#### Feature Tests
- `php artisan test --filter=LoyaltyApiTest`: Verify the `/api/v1/admin/analytics/loyalty-report` endpoint returns correct JSON structure and respect filters.

### Manual Verification (Frontend)
1. **System Config Check**:
    - Change `min_interaction_duration` in settings.
    - Sync a new call log on a device.
    - Verify if the analytics dashboard updates correctly based on the new threshold.
2. **PII Check**:
    - Open browser dev-tools.
    - Inspect the `/loyalty-report` API response.
    - Ensure `phone_hash` is visible but raw `phone_number` is ABSENT.
3. **Responsive UI**:
    - Verify charts and tables scale correctly on mobile vs desktop.

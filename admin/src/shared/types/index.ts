/**
 * Admin user type from Laravel Sanctum authentication
 */
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Call log entry from the API
 */
export interface CallLog {
    id: string;
    device_id: string;
    phone_number: string;
    contact_name: string | null;
    call_type: "incoming" | "outgoing" | "missed";
    duration: number;
    timestamp: string;
    classification: CallClassification | null;
    created_at: string;
}

/**
 * Call classification types
 */
export type CallClassificationType = "business" | "personal" | "ignored";

/**
 * Call classification record
 */
export interface CallClassification {
    id: string;
    call_log_id: string;
    classification: CallClassificationType;
    classified_by: number;
    classified_at: string;
}

/**
 * Device registered in the system
 */
export interface Device {
    id: string;
    device_identifier: string;
    device_name: string | null;
    device_model: string | null;
    status: "active" | "suspended";
    agent_id: string | null;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Sales agent
 */
export interface Agent {
    id: string;
    name: string;
    email: string;
    status: "active" | "inactive";
    phone: string | null;
    devices_count?: number;
    created_at: string;
    updated_at: string;
}

/**
 * Contact saved from calls
 */
export interface Contact {
    id: string;
    phone_number: string;
    name: string;
    company: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

/**
 * API error response
 */
export interface ApiErrorResponse {
    message: string;
    errors?: Record<string, string[]>;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
    total_calls: number;
    business_calls: number;
    personal_calls: number;
    total_duration: number;
    devices_active: number;
    agents_active: number;
}

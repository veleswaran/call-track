/**
 * Admin user type from Laravel Sanctum authentication
 */
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    roles: string[];
    permissions: string[];
    two_factor_enabled?: boolean;
    two_factor_confirmed_at?: string | null;
    is_agent?: boolean;
    agent?: Agent | null;
    created_at: string;
    updated_at: string;
}


export interface Role {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}
/**
 * Call log entry from the API
 */
export interface CallLog {
    id: number;
    device_id: number;
    device_name?: string | null;
    agent_name?: string | null;
    phone_number: string;
    phone_contact_name?: string | null;
    contact_name?: string | null;
    contact_notes?: string | null;
    call_type: "incoming" | "outgoing" | "missed" | "rejected" | "blocked" | "unknown";
    call_outcome: "Connected" | "Missed" | "No Answer";
    duration: number;
    timestamp: string;
    sim_slot?: number | null;
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
    id: number;
    call_log_id?: number;
    classification: CallClassificationType;
    classified_by: number;
    classified_at: string;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
}

/**
 * Device registered in the system
 */
export interface Device {
    id: number;
    device_identifier: string;
    device_uuid: string | null;
    device_name: string | null;
    device_model: string | null;
    os_version: string | null;
    app_version: string | null;
    status: "active" | "suspended";
    agent_id: number | null;
    agent: { id: number; name: string } | null;
    battery_level: number | null;
    has_fcm_token?: boolean;
    tracked_sim_slots: number[] | null;
    last_sync_at: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

/**
 * Sales agent
 */
export interface Agent {
    id: number;
    name: string;
    employee_code: string | null;
    status: "active" | "inactive";
    user_id?: number | null;
    user?: User | null;
    devices_count?: number;
    created_at: string;
    updated_at: string;
}

/**
 * Contact saved from calls
 */
export interface Contact {
    id: number;
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
 * Single resource API response
 */
export interface ResourceResponse<T> {
    data: T;
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
    ignored_calls: number;
    unclassified_calls: number;
    missed_calls: number;
    total_duration_seconds: number;
    average_call_duration_seconds: number;
    total_devices: number;
    active_devices: number;
    total_agents: number;
    // Week-over-week comparison percentages
    total_calls_change_percent: number | null;
    active_devices_change_percent: number | null;
    missed_calls_change_percent: number | null;
    average_call_duration_change_percent: number | null;
    total_duration_change_percent: number | null;
    pending_escalations: number | null;
    unattended_escalations: number | null;
    resolved_escalations: number | null;
}

export interface TwoFactorSetupResponse {
    secret: string;
    qr_code_url: string;
    recovery_codes: string[];
}

/**
 * Team Role
 */
export type TeamRole = "MANAGER" | "MEMBER";

/**
 * Team Member (Pivot)
 */
export interface TeamMember {
    id: number;
    team_id: number;
    agent_id: number;
    role: TeamRole;
    created_at: string;
    updated_at: string;
    // Relationships
    agent?: Agent;
}

/**
 * Team entity
 */
export interface Team {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    members?: TeamMember[];
    members_count?: number;
    managers_count?: number;
}

/**
 * Device lifecycle event
 */
export interface DeviceEvent {
    id: number;
    device_id: number;
    event_type: string;
    payload: Record<string, unknown> | null;
    occurred_at: string;
    created_at: string;
}

export type DeviceEventType =
    | "APP_STOPPED"
    | "APP_DEREGISTERED"
    | "APP_UNINSTALLED"
    | "PERMISSION_DENIED"
    | "PERMISSION_GRANTED"
    | "BATTERY_OPTIMIZATION_ENABLED"
    | "FOREGROUND_SERVICE_BLOCKED"
    | "DEVICE_REBOOTED"
    | "TOKEN_EXPIRED"
    | "CALL_LOG_ACCESS_FAILED";

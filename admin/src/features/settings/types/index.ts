export interface SettingsData {
    heartbeat_threshold_minutes: number;
    fcm_stale_title: string;
    fcm_stale_body: string;
    escalation_sla_hours?: number;
    enable_device_search: boolean;
    enable_user_search: boolean;
    enable_agent_search: boolean;
    enable_contact_search: boolean;
    enable_report_sim_filter: boolean;
    enable_call_log_sim_filter: boolean;
    enable_agent_status_filter: boolean;
    enable_device_status_filter: boolean;
    enable_call_log_internal_filter: boolean;
    enable_report_internal_filter: boolean;
    enable_missed_call_internal_filter: boolean;
}

export interface SettingsUpdatePayload {
    settings: Record<string, unknown>;
}

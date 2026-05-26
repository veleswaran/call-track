export interface SettingsData {
    app_sitename?: string;
    heartbeat_threshold_minutes: number;
    device_archive_days?: number;
    fcm_stale_title: string;
    fcm_stale_body: string;
    escalation_sla_hours?: number;
    enable_contact_search: boolean;
    enable_call_log_sim_filter: boolean;
    enable_agent_status_filter: boolean;
    enable_device_status_filter: boolean;
    enable_call_log_internal_filter: boolean;
    enable_report_internal_filter: boolean;
    enable_missed_call_internal_filter: boolean;
    enable_call_log_agent_filter: boolean;
    enable_missed_call_agent_filter: boolean;
    enable_report_agent_filter: boolean;
    enable_call_log_team_filter: boolean;
    enable_missed_call_team_filter: boolean;
    enable_report_team_filter: boolean;
    enable_call_log_class_filter: boolean;
    enable_report_class_filter: boolean;
    enable_call_log_outcome_filter: boolean;
    enable_report_outcome_filter: boolean;
}

export interface SettingsUpdatePayload {
    settings: Record<string, unknown>;
}

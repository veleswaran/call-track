export interface SettingsData {
    heartbeat_threshold_minutes: number;
    fcm_stale_title: string;
    fcm_stale_body: string;
}

export interface SettingsUpdatePayload {
    settings: Record<string, any>;
}

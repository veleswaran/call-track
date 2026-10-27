import { DateRange } from "react-day-picker";

export type CustomerSummaryTab = "all" | "with-missed" | "high-duration";
export type CustomerSummarySortKey = "total_calls" | "missed_calls" | "total_duration";
export type SortOrder = "asc" | "desc";

export interface LastCallDetail {
    time: string;
    raw_time: string;
    direction: "INCOMING" | "OUTGOING" | "MISSED" | string;
    duration_formatted: string;
    is_missed: boolean;
    agent_name: string;
    agent_code: string;
}

export interface PrimaryAgentDetail {
    name: string;
    team: string;
}

export interface CustomerSummaryItem {
    phone_hash: string;
    customer_name: string;
    organization: string;
    phone_number: string;
    total_calls: number;
    missed_calls: number;
    total_duration: string;
    total_duration_raw: number;
    avg_duration: string;
    avg_duration_raw: number;
    last_call: LastCallDetail | null;
    primary_agent: PrimaryAgentDetail;
}

export interface CustomerSummaryMetrics {
    total_accounts: number;
    total_calls: number;
    connected_calls: number;
    connected_pct: number;
    total_talk_time: string;
    total_talk_time_raw: number;
    missed_calls: number;
    pending_missed_calls?: number;
    sla_pending_count: number;
    unattended_count?: number;
    auto_resolved_count: number;
}

export interface CustomerSummaryFiltersData {
    dateRange: DateRange | undefined;
    outcome?: string;
    type?: string;
    agentIds?: string[] | null;
    teamIds?: string[] | null;
    contactFilter?: "all" | "internal" | "external" | null;
    simSlot?: number | null;
    tab?: CustomerSummaryTab;
}

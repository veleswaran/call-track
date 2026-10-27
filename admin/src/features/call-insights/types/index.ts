import { DateRange } from "react-day-picker";

export interface CallInsightsFiltersData {
    dateRange: DateRange | undefined;
    outcome: string;
    type: string;
    agentIds?: string[] | null;
    teamIds?: string[] | null;
    contactFilter?: "all" | "internal" | "external" | null;
    simSlot?: number | null;
}

export interface TopCaller {
    rank: number;
    id: number;
    agent: string;
    employee_code: string;
    team: string;
    first_call_time: string;
    total_calls: number;
    connected: number;
    missed: number;
    avg_duration: string;
    total_duration: string;
    total_duration_raw: number;
    handling_rate: number;
}

export interface AgentInsightsData {
    agent: {
        id: number;
        name: string;
        employee_code: string;
        team: string;
        device_hardware_id: string;
        first_call_time: string;
        handling_rate: number;
    } | null;
    kpis: {
        calls_in_period: number;
        connected_calls: number;
        connected_rate: number;
        missed_calls: number;
        pending_missed_calls?: number;
        resolved_missed_calls?: number;
        sla_resolution_rate: number;
        total_talk_time: string;
        total_talk_time_raw: number;
        avg_talk_time: string;
    };
    daily_distribution: Array<{
        date: string;
        raw_date: string;
        total_calls: number;
        connected: number;
        missed: number;
        talk_duration: string;
        talk_duration_raw: number;
        performance_percentage: number;
    }>;
    outreach_characteristics: {
        direction: {
            outbound_pct: number;
            inbound_pct: number;
        };
        sim_allocation: {
            sim_1_pct: number;
            sim_2_pct: number;
        };
        classification: {
            business_pct: number;
            personal_pct: number;
        };
        device_hardware_id: string;
    };
}

export interface FrequentlyContacted {
    phone_hash: string;
    customer_name: string;
    phone_number: string;
    account_category: string;
    total_touchpoints: number;
    in_count: number;
    out_count: number;
    in_out_ratio: string;
    total_talk_time: string;
    total_talk_time_raw: number;
    agents_handled: string;
    last_contacted: string;
    last_contacted_raw: string;
    agent_contacts?: Array<{
        agent_name: string;
        contact_name: string;
    }>;
}

export interface LongestCall {
    id: number;
    customer_name: string;
    phone_number: string;
    agent: string;
    employee_code: string;
    team: string;
    timestamp: string;
    direction: string;
    duration: string;
    duration_raw: number;
    classification: string;
}

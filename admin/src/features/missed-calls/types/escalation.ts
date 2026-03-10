import { CallLog } from "@shared/types";

export type EscalationStatus = "pending" | "unattended" | "resolved";

export interface CallEscalation {
    id: number;
    status: EscalationStatus;
    response_due_at: string;
    resolved_at: string | null;
    call_log: CallLog;
    resolved_by_call?: CallLog | null;
    created_at: string;
    updated_at: string;
}

export interface EscalationSummary {
    total_missed: number;
    pending: number;
    unattended: number;
    resolved: number;
}

export interface EscalationInsightsResponse {
    data: CallEscalation[];
    meta: {
        summary: EscalationSummary;
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

export interface GetEscalationsParams {
    team_id?: string | number | null;
    agent_id?: string | number | null;
    status?: EscalationStatus | "all" | null;
    date_from?: string | null;
    date_to?: string | null;
    page?: number;
    per_page?: number;
}

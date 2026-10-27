import { api } from "@shared/api/api";
import { PaginatedResponse } from "@shared/types";
import {
    TopCaller,
    AgentInsightsData,
    FrequentlyContacted,
    LongestCall,
} from "../types";

export interface InsightsQueryParams {
    start_date?: string;
    end_date?: string;
    outcomes?: string[];
    types?: string[];
    agent_ids?: string[];
    team_ids?: string[];
    contact_filter?: string;
    sim_slot?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    page?: number;
    per_page?: number;
}

const buildQueryString = (params: InsightsQueryParams): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
                value.forEach((v) => searchParams.append(`${key}[]`, String(v)));
            } else {
                searchParams.append(key, String(value));
            }
        }
    });
    return searchParams.toString();
};

export const callInsightsService = {
    getTopCallers: async (params: InsightsQueryParams = {}): Promise<PaginatedResponse<TopCaller>> => {
        const qs = buildQueryString(params);
        return api.get<PaginatedResponse<TopCaller>>(`/api/v1/admin/call-insights/top-callers?${qs}`);
    },

    getAgentInsights: async (params: InsightsQueryParams = {}): Promise<AgentInsightsData> => {
        const qs = buildQueryString(params);
        const res = await api.get<{ data: AgentInsightsData }>(`/api/v1/admin/call-insights/agent-insights?${qs}`);
        return res.data;
    },

    getFrequentlyContacted: async (params: InsightsQueryParams = {}): Promise<PaginatedResponse<FrequentlyContacted>> => {
        const qs = buildQueryString(params);
        return api.get<PaginatedResponse<FrequentlyContacted>>(`/api/v1/admin/call-insights/frequently-contacted?${qs}`);
    },

    getLongestCalls: async (params: InsightsQueryParams = {}): Promise<PaginatedResponse<LongestCall>> => {
        const qs = buildQueryString(params);
        return api.get<PaginatedResponse<LongestCall>>(`/api/v1/admin/call-insights/longest-calls?${qs}`);
    },
};

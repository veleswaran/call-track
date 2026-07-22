import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import {
    GetEscalationsParams,
    EscalationInsightsResponse
} from "../types/escalation";

export const getEscalations = async (params: GetEscalationsParams): Promise<EscalationInsightsResponse> => {
    const searchParams = new URLSearchParams();

    if (params.team_ids && params.team_ids.length > 0) {
        params.team_ids.forEach(id => searchParams.append("team_ids[]", id.toString()));
    }
    if (params.agent_id) searchParams.append("agent_id", params.agent_id.toString());
    if (params.status && params.status !== "all") {
        if (Array.isArray(params.status)) {
            params.status.forEach(s => searchParams.append("status[]", s));
        } else {
            searchParams.append("status", params.status);
        }
    }
    if (params.date_from) searchParams.append("date_from", params.date_from);
    if (params.date_to) searchParams.append("date_to", params.date_to);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.per_page) searchParams.append("per_page", params.per_page.toString());
    if (params.contact_filter && params.contact_filter !== "all") {
        searchParams.append("contact_filter", params.contact_filter);
    }
    if (params.types && params.types.length > 0) {
        params.types.forEach(type => searchParams.append("types[]", type));
    }
    if (params.sim_slot !== undefined && params.sim_slot !== null) {
        searchParams.append("sim_slot", params.sim_slot.toString());
    }
    const queryString = searchParams.toString();
    const endpoint = `/api/v1/admin/call-logs/escalations${queryString ? `?${queryString}` : ""}`;

    return api.get<EscalationInsightsResponse>(endpoint);
};

export const useEscalationInsights = (params: GetEscalationsParams) => {
    return useQuery({
        queryKey: ["escalations", params],
        queryFn: () => getEscalations(params),
    });
};

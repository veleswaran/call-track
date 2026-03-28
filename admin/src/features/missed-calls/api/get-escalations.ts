import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import {
    GetEscalationsParams,
    EscalationInsightsResponse
} from "../types/escalation";

export const getEscalations = async (params: GetEscalationsParams): Promise<EscalationInsightsResponse> => {
    const searchParams = new URLSearchParams();

    if (params.team_id) searchParams.append("team_id", params.team_id.toString());
    if (params.agent_id) searchParams.append("agent_id", params.agent_id.toString());
    if (params.status && params.status !== "all") searchParams.append("status", params.status);
    if (params.date_from) searchParams.append("date_from", params.date_from);
    if (params.date_to) searchParams.append("date_to", params.date_to);
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.per_page) searchParams.append("per_page", params.per_page.toString());

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

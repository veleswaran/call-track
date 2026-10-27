import { useQuery } from "@tanstack/react-query";
import { callInsightsService, InsightsQueryParams } from "../api/call-insights-service";

export const callInsightsKeys = {
    all: ["call-insights"] as const,
    topCallers: (params: InsightsQueryParams) => [...callInsightsKeys.all, "top-callers", params] as const,
    agentInsights: (params: InsightsQueryParams) => [...callInsightsKeys.all, "agent-insights", params] as const,
    frequentlyContacted: (params: InsightsQueryParams) => [...callInsightsKeys.all, "frequently-contacted", params] as const,
    longestCalls: (params: InsightsQueryParams) => [...callInsightsKeys.all, "longest-calls", params] as const,
};

export function useTopCallersQuery(params: InsightsQueryParams, enabled: boolean = true) {
    return useQuery({
        queryKey: callInsightsKeys.topCallers(params),
        queryFn: () => callInsightsService.getTopCallers(params),
        enabled,
    });
}

export function useAgentInsightsQuery(params: InsightsQueryParams, enabled: boolean = true) {
    return useQuery({
        queryKey: callInsightsKeys.agentInsights(params),
        queryFn: () => callInsightsService.getAgentInsights(params),
        enabled,
    });
}

export function useFrequentlyContactedQuery(params: InsightsQueryParams, enabled: boolean = true) {
    return useQuery({
        queryKey: callInsightsKeys.frequentlyContacted(params),
        queryFn: () => callInsightsService.getFrequentlyContacted(params),
        enabled,
    });
}

export function useLongestCallsQuery(params: InsightsQueryParams, enabled: boolean = true) {
    return useQuery({
        queryKey: callInsightsKeys.longestCalls(params),
        queryFn: () => callInsightsService.getLongestCalls(params),
        enabled,
    });
}

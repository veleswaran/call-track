import { useQuery } from "@tanstack/react-query";
import { customerSummaryApi } from "../api/customer-summary-api";

export function useCustomerSummaryQuery(params: Record<string, unknown> = {}, enabled: boolean = true) {
    return useQuery({
        queryKey: ["customer-summary", params],
        queryFn: () => customerSummaryApi.getSummary(params),
        enabled,
    });
}

export function useCustomerSummaryMetricsQuery(params: Record<string, unknown> = {}, enabled: boolean = true) {
    return useQuery({
        queryKey: ["customer-summary-metrics", params],
        queryFn: () => customerSummaryApi.getMetrics(params),
        enabled,
    });
}

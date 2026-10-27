import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    useCustomerSummaryQuery,
    useCustomerSummaryMetricsQuery,
} from "./use-customer-summary";
import { customerSummaryApi } from "../api/customer-summary-api";
import React from "react";

vi.mock("../api/customer-summary-api", () => ({
    customerSummaryApi: {
        getSummary: vi.fn(),
        getMetrics: vi.fn(),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    // eslint-disable-next-line react/display-name
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe("use-customer-summary hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("useCustomerSummaryQuery fetches customer summary list", async () => {
        const mockData = { data: [], meta: { total: 0 } };
        vi.mocked(customerSummaryApi.getSummary).mockResolvedValueOnce(mockData as unknown as ReturnType<typeof customerSummaryApi.getSummary>);

        const { result } = renderHook(() => useCustomerSummaryQuery({ tab: "all" }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(customerSummaryApi.getSummary).toHaveBeenCalledWith({ tab: "all" });
        expect(result.current.data).toEqual(mockData);
    });

    it("useCustomerSummaryMetricsQuery fetches summary metrics", async () => {
        const mockData = { data: { total_accounts: 100 } };
        vi.mocked(customerSummaryApi.getMetrics).mockResolvedValueOnce(mockData as unknown as ReturnType<typeof customerSummaryApi.getMetrics>);

        const { result } = renderHook(() => useCustomerSummaryMetricsQuery({}), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(customerSummaryApi.getMetrics).toHaveBeenCalledWith({});
        expect(result.current.data).toEqual(mockData);
    });
});

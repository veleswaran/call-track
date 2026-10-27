import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    useTopCallersQuery,
    useAgentInsightsQuery,
    useFrequentlyContactedQuery,
    useLongestCallsQuery,
} from "./use-call-insights";
import { callInsightsService } from "../api/call-insights-service";
import React from "react";

vi.mock("../api/call-insights-service", () => ({
    callInsightsService: {
        getTopCallers: vi.fn(),
        getAgentInsights: vi.fn(),
        getFrequentlyContacted: vi.fn(),
        getLongestCalls: vi.fn(),
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

describe("use-call-insights hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("useTopCallersQuery fetches top callers", async () => {
        const mockData = { data: [], meta: { total: 0 } };
        vi.mocked(callInsightsService.getTopCallers).mockResolvedValueOnce(mockData as unknown as ReturnType<typeof callInsightsService.getTopCallers>);

        const { result } = renderHook(() => useTopCallersQuery({ page: 1 }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(callInsightsService.getTopCallers).toHaveBeenCalledWith({ page: 1 });
        expect(result.current.data).toEqual(mockData);
    });

    it("useAgentInsightsQuery fetches agent insights", async () => {
        const mockData = { agent: { id: 1, name: "Test" } };
        vi.mocked(callInsightsService.getAgentInsights).mockResolvedValueOnce(mockData as unknown as ReturnType<typeof callInsightsService.getAgentInsights>);

        const { result } = renderHook(() => useAgentInsightsQuery({ agent_ids: ["1"] }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(callInsightsService.getAgentInsights).toHaveBeenCalledWith({ agent_ids: ["1"] });
    });

    it("useFrequentlyContactedQuery fetches frequently contacted numbers", async () => {
        const mockData = { data: [], meta: { total: 0 } };
        vi.mocked(callInsightsService.getFrequentlyContacted).mockResolvedValueOnce(mockData as unknown as ReturnType<typeof callInsightsService.getFrequentlyContacted>);

        const { result } = renderHook(() => useFrequentlyContactedQuery({}), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(callInsightsService.getFrequentlyContacted).toHaveBeenCalledWith({});
    });

    it("useLongestCallsQuery fetches longest calls", async () => {
        const mockData = { data: [], meta: { total: 0 } };
        vi.mocked(callInsightsService.getLongestCalls).mockResolvedValueOnce(mockData as unknown as ReturnType<typeof callInsightsService.getLongestCalls>);

        const { result } = renderHook(() => useLongestCallsQuery({}), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(callInsightsService.getLongestCalls).toHaveBeenCalledWith({});
    });
});

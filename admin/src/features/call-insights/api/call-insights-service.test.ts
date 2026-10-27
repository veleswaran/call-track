import { describe, it, expect, vi, beforeEach } from "vitest";
import { callInsightsService } from "./call-insights-service";
import { api } from "@shared/api/api";

vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

describe("callInsightsService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getTopCallers", () => {
        it("should fetch top callers with query params", async () => {
            const mockResponse = { data: [], meta: { total: 0 } };
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            const result = await callInsightsService.getTopCallers({
                start_date: "2026-10-01",
                end_date: "2026-10-27",
                outcomes: ["connected"],
                agent_ids: ["1", "2"],
                page: 1,
                per_page: 10,
            });

            expect(api.get).toHaveBeenCalledWith(
                "/api/v1/admin/call-insights/top-callers?start_date=2026-10-01&end_date=2026-10-27&outcomes%5B%5D=connected&agent_ids%5B%5D=1&agent_ids%5B%5D=2&page=1&per_page=10"
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe("getAgentInsights", () => {
        it("should fetch agent insights and return inner data", async () => {
            const mockData = { agent: { id: 1, name: "Test" }, kpis: {}, daily_distribution: [], outreach_characteristics: {} };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

            const result = await callInsightsService.getAgentInsights({ agent_ids: ["1"] });

            expect(api.get).toHaveBeenCalledWith("/api/v1/admin/call-insights/agent-insights?agent_ids%5B%5D=1");
            expect(result).toEqual(mockData);
        });
    });

    describe("getFrequentlyContacted", () => {
        it("should fetch frequently contacted numbers", async () => {
            const mockResponse = { data: [], meta: { total: 0 } };
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            const result = await callInsightsService.getFrequentlyContacted({ page: 2 });

            expect(api.get).toHaveBeenCalledWith("/api/v1/admin/call-insights/frequently-contacted?page=2");
            expect(result).toEqual(mockResponse);
        });
    });

    describe("getLongestCalls", () => {
        it("should fetch longest calls", async () => {
            const mockResponse = { data: [], meta: { total: 0 } };
            vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

            const result = await callInsightsService.getLongestCalls({ sort_order: "desc" });

            expect(api.get).toHaveBeenCalledWith("/api/v1/admin/call-insights/longest-calls?sort_order=desc");
            expect(result).toEqual(mockResponse);
        });
    });
});
